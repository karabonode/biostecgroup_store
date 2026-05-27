#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: bash scripts/test-local-webhook.sh <ORDER_NUMBER> [TOKEN]"
  echo "Example: bash scripts/test-local-webhook.sh ORD-2026-ABC123 local_webhook_dev_2026"
  exit 1
fi

ORDER_NUMBER="$1"
TOKEN="${2:-local_webhook_dev_2026}"
URL="http://localhost/biostecgroup-1/api/webhooks/yoco.php?token=${TOKEN}"

PAYLOAD=$(cat <<JSON
{
  "type": "checkout.succeeded",
  "metadata": {
    "order_number": "${ORDER_NUMBER}"
  }
}
JSON
)

echo "Posting local webhook simulation to: ${URL}"
echo "Payload: ${PAYLOAD}"

echo
curl -sS -X POST "${URL}" \
  -H "Content-Type: application/json" \
  --data "${PAYLOAD}" | cat

echo

echo "Checking order status..."
curl -sS "http://localhost/biostecgroup-1/api/orders/status.php?order_number=${ORDER_NUMBER}" | cat

echo
