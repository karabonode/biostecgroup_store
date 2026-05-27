import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import http from "http";
import axios from "axios";
import dotenv from "dotenv";
import { spawn, ChildProcess } from "child_process";

dotenv.config();

function listenWithPortFallback(app: ReturnType<typeof express>, host: string, preferredPort: number) {
  return new Promise<number>((resolve, reject) => {
    const maxPort = preferredPort + 20;

    const tryPort = (port: number) => {
      const server = app.listen(port, host, () => resolve(port));

      server.on("error", (error: any) => {
        if (error?.code === "EADDRINUSE" && port < maxPort) {
          console.warn(`Port ${port} is in use. Trying ${port + 1}...`);
          tryPort(port + 1);
          return;
        }
        reject(error);
      });
    };

    tryPort(preferredPort);
  });
}

async function isHttpReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeout);
    return res.status > 0;
  } catch {
    return false;
  }
}

async function ensurePhpApiServerRunning(): Promise<ChildProcess | null> {
  const autoStart = process.env.AUTO_START_PHP_API !== "0";
  const apiOrigin = process.env.PHP_API_ORIGIN || "http://127.0.0.1:8000";
  const probeUrl = `${apiOrigin}/api/products/list.php`;

  if (await isHttpReachable(probeUrl)) {
    console.log(`PHP API detected at ${apiOrigin}`);
    return null;
  }

  if (!autoStart) {
    console.warn(`PHP API is not reachable at ${apiOrigin}. Set AUTO_START_PHP_API=1 or start it manually.`);
    return null;
  }

  console.log(`Starting PHP API server at ${apiOrigin}...`);
  const phpProcess = spawn("php", ["-S", "127.0.0.1:8000", "-t", "."], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  phpProcess.stdout?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) {
      console.log(`[php] ${text}`);
    }
  });

  phpProcess.stderr?.on("data", (chunk) => {
    const text = String(chunk).trim();
    if (text) {
      console.error(`[php] ${text}`);
    }
  });

  phpProcess.on("exit", async (code) => {
    const stillReachable = await isHttpReachable(probeUrl);
    if (code === 1 && stillReachable) {
      console.log(`PHP API already running on ${apiOrigin}; continuing with existing process.`);
      return;
    }
    console.warn(`PHP API server exited with code ${code}`);
  });

  // Give PHP server a moment to bind.
  await new Promise((resolve) => setTimeout(resolve, 700));
  const nowReachable = await isHttpReachable(probeUrl);
  if (!nowReachable) {
    console.warn(`PHP API is still not reachable at ${apiOrigin}.`);
  }

  return phpProcess;
}

async function startServer() {
  const app = express();
  const preferredPort = Number(process.env.PORT || 3000);
  const phpProcess = await ensurePhpApiServerRunning();

  app.use(express.json());

  // Paystack Initialize Transaction
  app.post("/api/checkout", async (req, res) => {
    const { email, amountCents, metadata } = req.body;
    
    try {
      const response = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email,
          amount: amountCents, // Paystack expects amount in kobo/cents
          metadata,
          callback_url: `${process.env.APP_URL}/checkout/success`,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      console.error("Paystack Error:", error.response?.data || error.message);
      res.status(500).json({ error: "Failed to initialize payment" });
    }
  });

  // Paystack Verify Transaction
  app.get("/api/verify/:reference", async (req, res) => {
    const { reference } = req.params;
    try {
      const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      );
      res.json(response.data);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // Proxy all remaining /api/* requests to the PHP server
  app.use("/api", (req, res) => {
    const phpOrigin = process.env.PHP_API_ORIGIN || "http://127.0.0.1:8000";
    const parsed = new URL(phpOrigin);

    // Re-serialise body for JSON requests (express.json() already consumed the stream)
    let bodyBuf: Buffer | null = null;
    if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
      bodyBuf = Buffer.from(JSON.stringify(req.body));
    }

    const headers: Record<string, string | string[] | undefined> = {
      ...req.headers,
      host: parsed.host,
    };
    if (bodyBuf) headers["content-length"] = String(bodyBuf.length);

    const proxyReq = http.request(
      {
        hostname: parsed.hostname,
        port: Number(parsed.port) || 8000,
        path: req.originalUrl,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 200, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      }
    );

    proxyReq.on("error", (err) => {
      console.error("[php-proxy]", err.message);
      if (!res.headersSent) res.status(502).json({ error: "PHP server unavailable" });
    });

    if (bodyBuf) {
      proxyReq.write(bodyBuf);
      proxyReq.end();
    } else {
      req.pipe(proxyReq, { end: true });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          // Allow overriding HMR port; default 0 asks OS for a free port.
          port: Number(process.env.HMR_PORT || 0),
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const runningPort = await listenWithPortFallback(app, "0.0.0.0", preferredPort);
  console.log(`Server running on http://localhost:${runningPort}`);

  const shutdown = () => {
    if (phpProcess && !phpProcess.killed) {
      phpProcess.kill("SIGTERM");
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();
