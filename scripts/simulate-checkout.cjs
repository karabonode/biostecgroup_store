/**
 * simulate-checkout.cjs
 * Full purchase simulation using your installed Chrome.
 *
 * Strategy:
 *   - API calls (login, create order, create Yoco checkout) go directly to XAMPP — reliable, fast.
 *   - Chrome is used for the visual flow: checkout form → Yoco payment page → success page.
 *
 * Run:  node scripts/simulate-checkout.cjs
 */

const puppeteer = require('puppeteer-core');
const http      = require('http');
const path      = require('path');
const fs        = require('fs');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const APP    = 'http://localhost:3001';
const API    = 'http://localhost/biostecgroup-1/api';

const EMAIL = 'sim_buyer@biostec.local';
const PASS  = 'Sim1234!';

// Yoco test card
const CARD_NUM  = '4111111111111111';
const CARD_EXP  = '12/28';
const CARD_CVV  = '123';
const CARD_NAME = 'Test Buyer';

const DIR = path.join(__dirname, '../sim-screenshots');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const log  = msg => console.log(`\n[▶] ${msg}`);
const ok   = msg => console.log(`    ✅ ${msg}`);
const warn = msg => console.log(`    ⚠️  ${msg}`);
const fail = msg => console.log(`    ❌ ${msg}`);
const snap = async (page, name) => {
  const f = path.join(DIR, `${name}.png`);
  await page.screenshot({ path: f, fullPage: false });
  ok(`screenshot → sim-screenshots/${name}.png`);
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── HTTP helper ───────────────────────────────────────────────────────────────
function apiCall(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost',
      port:     80,
      path:     '/biostecgroup-1' + path,
      method,
      headers:  {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...headers,
      },
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Biostec Group — Purchase Simulation       ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── Pre-check: dev server running ─────────────────────────────────────────
  const serverUp = await new Promise(r =>
    http.get(APP, res => r(res.statusCode < 500)).on('error', () => r(false))
  );
  if (!serverUp) { fail(`Dev server not running at ${APP}. Run: npm run dev`); process.exit(1); }
  ok(`Dev server up at ${APP}`);

  // ── Step 1: Login via XAMPP API ──────────────────────────────────────────
  log('Step 1 — Authenticating via API');

  let loginRes = await apiCall('POST', '/api/auth/login.php', { email: EMAIL, password: PASS });
  if (!loginRes.body.token) {
    loginRes = await apiCall('POST', '/api/auth/register.php', {
      email: EMAIL, password: PASS,
      first_name: 'Sim', last_name: 'Buyer',
    });
  }
  if (!loginRes.body.token) { fail('Auth failed: ' + JSON.stringify(loginRes.body)); process.exit(1); }

  const token = loginRes.body.token;
  const user  = loginRes.body.user;
  ok(`Authenticated as ${EMAIL} (user id: ${user?.id})`);

  // ── Step 2: Create order via XAMPP API ───────────────────────────────────
  log('Step 2 — Creating order via API');

  const orderRes = await apiCall('POST', '/api/orders/create.php', {
    customer: {
      firstName: 'Sim', lastName: 'Buyer',
      email: EMAIL, phone: '0611234567',
    },
    delivery: { method: 'pickup' },
    items: [{ productId: 1, quantity: 1 }],
    totals: { subtotal: 500000, shipping: 0, total: 500000 },
  }, { Authorization: `Bearer ${token}` });

  if (!orderRes.body.success) {
    fail('Order creation failed: ' + JSON.stringify(orderRes.body));
    process.exit(1);
  }

  const { order_number: orderNumber, total_amount: totalCents } = orderRes.body;
  ok(`Order created: ${orderNumber}  (R${(totalCents / 100).toFixed(2)})`);

  // ── Step 3: Create Yoco checkout session via XAMPP API ───────────────────
  log('Step 3 — Creating Yoco checkout session via API');

  const successUrl = `${APP}/checkout/success?order=${orderNumber}`;
  const cancelUrl  = `${APP}/checkout`;

  const payRes = await apiCall('POST', '/api/orders/pay.php', {
    order_number: orderNumber,
    success_url:  successUrl,
    cancel_url:   cancelUrl,
  }, { Authorization: `Bearer ${token}` });

  if (!payRes.body.success) {
    fail('Payment session failed: ' + JSON.stringify(payRes.body));
    process.exit(1);
  }

  const { redirect_url: yocoRedirectUrl, checkout_id: checkoutId } = payRes.body;
  ok(`Yoco checkout session: ${checkoutId}`);
  ok(`Redirect URL: ${yocoRedirectUrl}`);

  // ── Step 4: Open Chrome, show checkout form, then navigate to Yoco ────────
  log('Step 4 — Launching Chrome');

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-infobars'],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(30000);
  page.on('pageerror', e => {
    const msg = e.message;
    if (!msg.includes('WebSocket') && !msg.includes('vite')) console.log(`   [page error] ${msg}`);
  });

  try {
    // Show the checkout form (visual context)
    log('Step 5 — Showing checkout form');
    await page.goto(APP, { waitUntil: 'domcontentloaded' });
    await sleep(300);

    // Inject auth + cart so the checkout page renders correctly
    await page.evaluate((tok, usr, orderNum) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify(usr));
      localStorage.setItem('biostec-cart', JSON.stringify({
        state: {
          items: [{
            id: '1', name: 'Dell Laptop (Grade A)',
            priceCents: 500000, quantity: 1, grade: 'A', imageUrl: '',
          }],
        },
        version: 0,
      }));
    }, token, user, orderNumber);

    await page.goto(`${APP}/checkout`, { waitUntil: 'networkidle2' });
    await sleep(1500);
    await snap(page, '01-checkout-form');
    ok('Checkout form shown');

    // Prefill the form visually (cosmetic — actual submission goes through API)
    const fillInput = async (sel, val) => {
      const el = await page.$(sel);
      if (!el) return;
      await el.click({ clickCount: 3 });
      await el.type(val, { delay: 25 });
      await sleep(80);
    };
    await fillInput('input[placeholder="John"]', 'Sim');
    await fillInput('input[placeholder="Doe"]',  'Buyer');
    await fillInput('input[type="email"]',        EMAIL);
    await fillInput('input[type="tel"]',          '0611234567');

    // Select pickup
    await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const p = btns.find(b => /pickup|collect|johannesburg/i.test(b.textContent || ''));
      if (p) p.click();
    });
    await sleep(400);
    await snap(page, '02-form-filled');
    ok('Form filled (cosmetic — order already created via API)');

    // ── Step 6: Navigate to Yoco payment page ───────────────────────────────
    log(`Step 6 — Navigating to Yoco payment page`);
    console.log(`   URL: ${yocoRedirectUrl}`);
    await page.goto(yocoRedirectUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(4000); // Yoco loads iframes async
    await snap(page, '03-yoco-page');
    ok(`On Yoco page: ${page.url().slice(0, 60)}…`);

    // ── Step 7: Select card payment tab on Yoco ───────────────────────────────
    log('Step 7 — Selecting card payment option on Yoco');

    // Yoco's checkout may show Apple Pay / Google Pay first — click the card tab
    const cardTabClicked = await page.evaluate(() => {
      const allEls = [...document.querySelectorAll('button, a, [role="tab"], [role="button"], div[class*="tab"], li')];
      const cardTab = allEls.find(el => {
        const t = (el.textContent || '').trim().toLowerCase();
        return (t.includes('card') && !t.includes('apple') && !t.includes('google') && t.length < 40)
          || t === 'credit card' || t === 'debit card' || t === 'pay with card';
      });
      if (cardTab) { cardTab.click(); return cardTab.textContent?.trim(); }
      return null;
    });

    if (cardTabClicked) {
      ok(`Clicked card tab: "${cardTabClicked}"`);
      await sleep(2000); // wait for card form to appear
    } else {
      warn('No card tab found — card form may already be visible');
    }

    await snap(page, '04-card-tab-selected');

    // ── Step 8: Fill card details on Yoco ────────────────────────────────────
    log('Step 8 — Filling card details on Yoco');

    // Refresh frame list (Yoco may load new iframes after tab click)
    await sleep(1000);
    const frames = page.frames();
    console.log(`   ${frames.length} frame(s) on page:`);
    for (const f of frames) {
      const u = f.url();
      if (u && u !== 'about:blank') console.log(`     ${u.slice(0, 80)}`);
    }

    // Find any input elements in the page + all frames
    const allInputInfo = await page.evaluate(() => {
      const inputs = [...document.querySelectorAll('input')];
      return inputs.map(i => ({
        type: i.type, name: i.name, id: i.id,
        placeholder: i.placeholder, autocomplete: i.autocomplete,
      }));
    });
    console.log(`   Inputs in main page: ${JSON.stringify(allInputInfo)}`);

    const tryFill = async (ctx, label) => {
      const cardInput = await ctx.$([
        'input[name="number"]', 'input[name="cardNumber"]', 'input[name="card-number"]',
        'input[autocomplete="cc-number"]', 'input[data-cy*="card"]',
        'input[placeholder*="card" i]', 'input[placeholder*="1234" i]',
        'input[class*="card" i]',
      ].join(', ')).catch(() => null);

      if (!cardInput) return false;
      ok(`Found card input in: ${label}`);

      await cardInput.click({ clickCount: 3 });
      await cardInput.type(CARD_NUM, { delay: 50 });
      ok(`Card number typed`);

      const expInput = await ctx.$([
        'input[name="expiry"]', 'input[name="expiryDate"]', 'input[name="exp"]',
        'input[autocomplete="cc-exp"]', 'input[autocomplete="cc-exp-month"]',
        'input[placeholder*="MM" i]', 'input[placeholder*="expir" i]',
        'input[class*="expir" i]',
      ].join(', ')).catch(() => null);
      if (expInput) { await expInput.click({ clickCount: 3 }); await expInput.type(CARD_EXP, { delay: 50 }); ok('Expiry typed'); }

      const cvvInput = await ctx.$([
        'input[name="cvv"]', 'input[name="cvc"]', 'input[name="securityCode"]',
        'input[name="security-code"]', 'input[autocomplete="cc-csc"]',
        'input[placeholder*="cvv" i]', 'input[placeholder*="cvc" i]', 'input[placeholder*="123" i]',
      ].join(', ')).catch(() => null);
      if (cvvInput) { await cvvInput.click({ clickCount: 3 }); await cvvInput.type(CARD_CVV, { delay: 50 }); ok('CVV typed'); }

      const nameInput = await ctx.$([
        'input[name="cardholderName"]', 'input[name="name"]', 'input[name="cardholder"]',
        'input[autocomplete="cc-name"]',
        'input[placeholder*="name" i]', 'input[placeholder*="holder" i]',
      ].join(', ')).catch(() => null);
      if (nameInput) { await nameInput.click({ clickCount: 3 }); await nameInput.type(CARD_NAME, { delay: 50 }); ok('Name typed'); }

      return true;
    };

    let filled = false;
    filled = await tryFill(page, 'main page');
    if (!filled) {
      for (const frame of frames) {
        const u = frame.url();
        if (!u || u === 'about:blank' || u.includes('google.com') || u.includes('apple.com')) continue;
        filled = await tryFill(frame, u.slice(0, 50));
        if (filled) break;
      }
    }

    if (!filled) {
      warn('Could not auto-fill card fields — please fill manually in Chrome:');
      console.log(`   Card number: ${CARD_NUM}`);
      console.log(`   Expiry:      ${CARD_EXP}`);
      console.log(`   CVV:         ${CARD_CVV}`);
      console.log('   Then click the Pay button and wait for the success page.');
    }

    await sleep(1500);
    await snap(page, '05-card-filled');

    // ── Step 9: Submit payment ────────────────────────────────────────────────
    log('Step 9 — Submitting Yoco card payment');

    const yocoPayBtn = await page.evaluate(() => {
      const all = [...document.querySelectorAll('button[type="submit"], button')];
      // Exclude Apple Pay, Google Pay buttons
      const btn = all.find(b => {
        const t = (b.textContent || '').trim();
        const lower = t.toLowerCase();
        return !lower.includes('apple') && !lower.includes('google') &&
               /^pay(\s|$)|submit|confirm|complete|proceed|place order/i.test(t) &&
               t.length < 50;
      });
      if (btn) { btn.click(); return btn.textContent?.trim(); }
      return null;
    });

    if (yocoPayBtn) ok(`Clicked: "${yocoPayBtn}"`);
    else            warn('Could not find card pay button — click it manually in Chrome');

    await sleep(2000);
    await snap(page, '05-yoco-submitted');

    // ── Step 9: Wait for Yoco to process, then verify ──────────────────────
    log('Step 9 — Waiting for Yoco to process payment (30 s max)…');
    console.log('   Note: Yoco does not redirect to localhost — we verify via API instead.');

    // Try automatic redirect first (works if Yoco allows localhost)
    let redirected = false;
    for (let i = 0; i < 20; i++) {
      await sleep(1500);
      const url = page.url();
      if (url.includes('localhost:3001') && url.includes('checkout/success')) {
        redirected = true;
        ok(`Automatic redirect at t+${(i + 1) * 1.5}s: ${url}`);
        await sleep(2000);
        await snap(page, '06-success-auto');
        break;
      }
      console.log(`   [${((i + 1) * 1.5).toFixed(0)}s] Still on: ${url.slice(0, 60)}`);
    }

    if (!redirected) {
      warn('No automatic redirect (expected for localhost success URLs).');
      await snap(page, '06-yoco-final');

      // Poll verify.php to check if Yoco has processed the payment
      log('Checking payment status via verify.php…');
      let verified = false;
      for (let attempt = 1; attempt <= 5; attempt++) {
        await sleep(3000);
        const vRes = await apiCall('GET', `/api/orders/verify.php?order_number=${orderNumber}`);
        console.log(`   verify attempt ${attempt}: HTTP ${vRes.status} → ${JSON.stringify(vRes.body).slice(0, 120)}`);
        if (vRes.body.payment_status === 'paid' || vRes.body.already_paid || vRes.status === 200) {
          verified = true;
          ok('Payment verified via Yoco API!');
          break;
        }
      }

      // Navigate browser to success page to demonstrate the UI
      log('Navigating browser to success page…');
      await page.goto(successUrl, { waitUntil: 'networkidle2' });
      await sleep(2000);
      await snap(page, '06-success-page');
      ok(`Success page shown: ${page.url()}`);
    }

    // ── Step 10: Check DB ───────────────────────────────────────────────────
    log('Step 10 — Verifying order in database');

    const statusRes = await apiCall('GET', `/api/orders/status.php?order_number=${orderNumber}`);
    const s = statusRes.body;

    console.log('\n   ┌──────────────────────────────────────────────┐');
    console.log(`   │ Order:          ${s.order_number || orderNumber}`);
    console.log(`   │ Payment status: ${(s.payment_status || '?').toUpperCase().padEnd(8)} ${s.payment_status === 'paid' ? '✅ PAID' : '⏳ ' + (s.payment_status || 'unknown')}`);
    console.log(`   │ Order status:   ${s.status || '?'}`);
    console.log(`   │ Total:          R${((s.total_amount || 0) / 100).toFixed(2)}`);
    console.log(`   │ Paid at:        ${s.paid_at || '(pending — webhook will arrive shortly)'}`);
    console.log('   └──────────────────────────────────────────────┘');

    if (s.payment_status !== 'paid') {
      console.log('\n   ℹ️  Yoco sends a webhook to confirm payment.');
      console.log('      Run:  node scripts/test-webhook.cjs');
      console.log(`      (Update ORDER_NUMBER to ${orderNumber} in that file)`);
    }

    console.log('\n╔══════════════════════════════════════════════╗');
    console.log('║   Screenshots saved to sim-screenshots/     ║');
    console.log('║   Browser stays open — close when done.     ║');
    console.log('╚══════════════════════════════════════════════╝\n');

    await sleep(60000);

  } catch (err) {
    fail(`Fatal: ${err.message}`);
    await snap(page, 'XX-error').catch(() => {});
    console.error(err.stack);
  } finally {
    await browser.close();
  }
})();
