/**
 * test-webhook.cjs
 * Simulates a Yoco payment.succeeded webhook event hitting our local handler.
 * Run:  node scripts/test-webhook.cjs
 */

const http   = require('http');
const crypto = require('crypto');

// ── Config ────────────────────────────────────────────────────────────────────
const WEBHOOK_URL  = 'http://localhost/biostecgroup-1/api/webhooks/yoco.php';
const RAW_SECRET   = 'whsec_QkZDQTYxNEI0RjlDQkE4RDhGNEU3OTREN0VBOENEMDM=';
const ORDER_NUMBER = 'ORD-2026-48C1F3';      // order we just created
const CHECKOUT_ID  = 'ch_vax4bryN7j26iNT5RKUYz0Ej';
const PAYMENT_ID   = 'pay_sim_' + Date.now();

// ── Build event payload (matches Yoco payment.succeeded format) ───────────────
const event = {
  id:          'evt_sim_' + Date.now(),
  type:        'payment.succeeded',
  createdDate: new Date().toISOString(),
  payload: {
    id:          PAYMENT_ID,
    amount:      5000,
    currency:    'ZAR',
    status:      'succeeded',
    mode:        'test',
    createdDate: new Date().toISOString(),
    metadata: {
      order_number: ORDER_NUMBER,
      checkoutId:   CHECKOUT_ID,
      customer:     'Test Buyer',
      email:        'test_buyer@biostec.local',
    },
    paymentMethodDetails: {
      type: 'card',
      card: {
        maskedCard:  '411111******1111',
        scheme:      'visa',
        cardHolder:  'TEST BUYER',
        expiryMonth: 12,
        expiryYear:  2028,
      },
    },
  },
};

const body = JSON.stringify(event);

// ── Compute HMAC-SHA256 signature ─────────────────────────────────────────────
// Secret format: "whsec_<base64>" → strip prefix, base64-decode to get key bytes
const b64Key  = RAW_SECRET.startsWith('whsec_') ? RAW_SECRET.slice('whsec_'.length) : RAW_SECRET;
const keyBytes = Buffer.from(b64Key, 'base64');
const sig      = crypto.createHmac('sha256', keyBytes).update(body).digest('hex');

console.log('\n──────────────────────────────────────────────────────');
console.log('  Yoco Webhook Simulation');
console.log('──────────────────────────────────────────────────────');
console.log(`  Order:      ${ORDER_NUMBER}`);
console.log(`  Checkout:   ${CHECKOUT_ID}`);
console.log(`  Payment ID: ${PAYMENT_ID}`);
console.log(`  Signature:  ${sig.slice(0, 16)}...`);
console.log(`  Target:     ${WEBHOOK_URL}`);
console.log('──────────────────────────────────────────────────────\n');

// ── Send the request ──────────────────────────────────────────────────────────
const url = new URL(WEBHOOK_URL);

const options = {
  hostname: url.hostname,
  port:     url.port || 80,
  path:     url.pathname,
  method:   'POST',
  headers: {
    'Content-Type':     'application/json',
    'Content-Length':   Buffer.byteLength(body),
    'webhook-signature': sig,
    'webhook-id':        event.id,
    'webhook-timestamp': Math.floor(Date.now() / 1000).toString(),
  },
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const ok = res.statusCode >= 200 && res.statusCode < 300;
    console.log(`  HTTP ${res.statusCode} ${ok ? '✅' : '❌'}`);
    console.log(`  Response: ${data}`);

    if (ok) {
      console.log('\n  ✅ Webhook accepted — waiting 2s then checking DB...\n');
      setTimeout(checkOrderStatus, 2000);
    } else {
      console.log('\n  ❌ Webhook rejected — check apache error log.\n');
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error(`  ❌ Request failed: ${e.message}`);
  console.error('     Is XAMPP Apache running? (http://localhost must be up)');
  process.exit(1);
});

req.write(body);
req.end();

// ── Verify DB was updated ─────────────────────────────────────────────────────
function checkOrderStatus() {
  const statusUrl = new URL(`http://localhost/biostecgroup-1/api/orders/status.php?order_number=${ORDER_NUMBER}`);
  const opts = {
    hostname: statusUrl.hostname,
    port:     80,
    path:     statusUrl.pathname + statusUrl.search,
    method:   'GET',
  };

  const r = http.request(opts, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      try {
        const order = JSON.parse(d);
        console.log('──────────────────────────────────────────────────────');
        console.log('  Order status after webhook:');
        console.log(`  order_number:    ${order.order_number}`);
        console.log(`  payment_status:  ${order.payment_status}  ${order.payment_status === 'paid' ? '✅ PAID' : '❌ still ' + order.payment_status}`);
        console.log(`  status:          ${order.status}`);
        console.log(`  total:           R${(order.total_amount / 100).toFixed(2)}`);
        console.log(`  paid_at:         ${order.paid_at || '(null)'}`);
        console.log('──────────────────────────────────────────────────────');

        if (order.payment_status === 'paid') {
          console.log('\n  🎉 SUCCESS — webhook updated the order to PAID.');
          console.log('     Confirmation emails would have been sent to:');
          console.log('       Customer → test_buyer@biostec.local');
          console.log('       Admin    → info@biostecgroup.co.za\n');
        } else {
          console.log('\n  ⚠️  Order not marked paid — check Apache error log:');
          console.log('     C:\\xampp\\apache\\logs\\error.log\n');
        }
      } catch {
        console.log('  Raw response:', d);
      }
    });
  });
  r.on('error', e => console.error('status check failed:', e.message));
  r.end();
}
