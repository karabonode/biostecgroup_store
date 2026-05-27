# Database API for Biostecgroup Local Editing

This project is a standalone PHP API that connects to your Biostecgroup MySQL database.
It was created in a separate folder so the live Biostecgroup site code is untouched.

## Folder

- `biostecgroup-1/database_api`

## What it does

- Connects to MySQL using `.env` settings.
- Prefers the shared `biostecgroup-1/.env` first, so it can use the same DB target as the live app config.
- Exposes REST-style endpoints for selected tables.
- Supports read and write operations for local offline work.
- Uses API key protection and CORS allowlist for local frontend apps.
- Supports read-only mode to prevent write operations during safe local access.

## Environment loading order

This API loads env files in this order:

1. `biostecgroup-1/.env` (shared app env, preferred)
2. `biostecgroup-1/database_api/.env` (fallback for missing values only)

This means if your shared app env has live DB credentials, this API will use the same database target.

## Endpoints

Base URL example (Apache/XAMPP):

- `http://localhost/biostecgroup-1/database_api/public`

Routes:

- `GET /health`
- `GET /tables`
- `GET /{table}`
- `GET /{table}/{id}`
- `POST /{table}`
- `PUT /{table}/{id}`
- `PATCH /{table}/{id}`
- `DELETE /{table}/{id}`

Allowed tables are controlled by `API_ALLOWED_TABLES` in `.env`.

## Setup on your local machine

1. Copy env template:
   - `cp .env.example .env`
2. Put DB values in `biostecgroup-1/.env` if you want to match the live app DB target exactly.
3. Edit `database_api/.env` only for fallback values or API-specific settings:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASS`
4. Set a strong API key in `database_api/.env`:
   - `API_KEY=your-secret-key`
5. Keep read-only enabled for safety:
  - `API_READ_ONLY=1`
6. Make sure Apache rewrite is enabled (for clean routes):
   - XAMPP/WAMP usually supports this by default.
7. Test API health:
   - `curl http://localhost/biostecgroup-1/database_api/public/health`

If remote DB access is blocked by hosting firewall rules, use an SSH tunnel and set `DB_HOST=127.0.0.1` with a forwarded local port.

## Example requests

### 1) Read products

```bash
curl -H "X-API-Key: your-secret-key" \
  "http://localhost/biostecgroup-1/database_api/public/products?limit=20&page=1"
```

### 2) Search products by name/sku

```bash
curl -H "X-API-Key: your-secret-key" \
  "http://localhost/biostecgroup-1/database_api/public/products?q=thinkpad&search=name,sku"
```

### 3) Create a product row

```bash
curl -X POST -H "Content-Type: application/json" -H "X-API-Key: your-secret-key" \
  -d '{
    "sku":"LOCAL-TEST-001",
    "name":"Local Test Laptop",
    "slug":"local-test-laptop",
    "price":499900,
    "stock_quantity":4,
    "is_active":1
  }' \
  "http://localhost/biostecgroup-1/database_api/public/products"
```

If `API_READ_ONLY=1`, this request returns `403` by design.

### 4) Update a product row

```bash
curl -X PUT -H "Content-Type: application/json" -H "X-API-Key: your-secret-key" \
  -d '{"stock_quantity":7}' \
  "http://localhost/biostecgroup-1/database_api/public/products/1"
```

### 5) Delete a row

```bash
curl -X DELETE -H "X-API-Key: your-secret-key" \
  "http://localhost/biostecgroup-1/database_api/public/products/1"
```

## Frontend connection example

```js
const API_BASE = "http://localhost/biostecgroup-1/database_api/public";
const API_KEY = "your-secret-key";

async function getProducts() {
  const res = await fetch(`${API_BASE}/products?limit=20`, {
    headers: { "X-API-Key": API_KEY }
  });
  return res.json();
}
```

## Notes

- This API expects tables with an `id` primary key for item routes.
- Auto-increment and timestamp fields like `created_at` and `updated_at` are excluded from write payloads.
- You can tighten table access using `API_ALLOWED_TABLES`.
- In read-only mode (`API_READ_ONLY=1`), only `GET/HEAD/OPTIONS` are allowed.
