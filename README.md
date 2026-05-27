<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/1d4718cd-8181-42f3-b1c8-b9721dfa8db8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Yoco Payments (Hosted Checkout)

This project uses server-side Yoco Checkout creation and webhook-based payment confirmation.

1. Add these values in `.env`:
   - `YOCO_PUBLIC_KEY`
   - `YOCO_SECRET_KEY`
   - `YOCO_WEBHOOK_TOKEN` (recommended)
   - `YOCO_WEBHOOK_SECRET` (optional signature validation)
2. Register this webhook endpoint in Yoco:
   - `https://your-domain/biostecgroup-1/api/webhooks/yoco.php?token=<YOCO_WEBHOOK_TOKEN>`
3. Checkout flow:
   - Create order: `POST /api/orders/create.php`
   - Create checkout session: `POST /api/checkouts/create.php`
   - Redirect customer to `redirectUrl`
4. Payment success source of truth:
   - Webhook `POST /api/webhooks/yoco.php` updates `orders.payment_status`
   - Client success page reads order status from `GET /api/orders/status.php`

## Localhost First Test

Use this flow to validate locally before deploying to a public server.

1. Start your local stack (XAMPP Apache + MySQL and frontend).
2. Ensure `.env` contains test keys and a webhook token.
3. Create an order from checkout and complete payment on Yoco hosted page.
4. Trigger local webhook simulation:
   - `bash scripts/test-local-webhook.sh ORD-YYYY-XXXXXX local_webhook_dev_2026`
5. Confirm `payment_status` becomes `paid` in the command output from:
   - `GET /api/orders/status.php?order_number=...`

When this works locally, switch the webhook URL to your public domain and register it in Yoco.
