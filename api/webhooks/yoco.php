<?php
/**
 * Yoco webhook handler.
 * POST /api/webhooks/yoco.php
 *
 * Event payload (payment.succeeded / payment.failed):
 * {
 *   "id":          "event-id",
 *   "type":        "payment.succeeded",
 *   "createdDate": "ISO-8601",
 *   "payload": {
 *     "id":       "payment-id",
 *     "amount":   5000,
 *     "currency": "ZAR",
 *     "status":   "succeeded",
 *     "mode":     "test|live",
 *     "metadata": { "order_number": "ORD-...", "checkoutId": "ch_..." },
 *     ...
 *   }
 * }
 *
 * Signature: HMAC-SHA256 of raw body, key = base64_decode(secret minus "whsec_" prefix).
 * Delivered in header:  webhook-signature
 */

require_once '../config/database.php';
require_once '../config/payment.php';
require_once '../email/order_notifications.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$rawBody = file_get_contents('php://input');
$secret  = getenv('YOCO_WEBHOOK_SECRET') ?: '';

// ── Signature verification ────────────────────────────────────────────────────
if ($secret !== '') {
    // Header name from Yoco docs: "webhook-signature"
    // PHP converts hyphens to underscores and uppercases: HTTP_WEBHOOK_SIGNATURE
    $sigHeader = $_SERVER['HTTP_WEBHOOK_SIGNATURE'] ?? '';

    if ($sigHeader === '') {
        http_response_code(400);
        error_log('yoco-webhook: missing webhook-signature header');
        exit;
    }

    // Secret is base64-encoded with a "whsec_" prefix — strip prefix then decode
    $keyB64  = (strpos($secret, 'whsec_') === 0) ? substr($secret, strlen('whsec_')) : $secret;
    $keyBytes = base64_decode($keyB64, true);
    if ($keyBytes === false) {
        $keyBytes = $secret; // fallback: use raw secret
    }

    $expected = hash_hmac('sha256', $rawBody, $keyBytes);

    // Strip any "v1," prefix Yoco may prepend to the signature value
    $received = ltrim(strtolower($sigHeader), 'v1,');

    if (!hash_equals($expected, $received)) {
        http_response_code(401);
        error_log('yoco-webhook: invalid signature');
        exit;
    }
}

$event = json_decode($rawBody, true);
if (!$event) {
    http_response_code(400);
    error_log('yoco-webhook: invalid JSON body');
    exit;
}

// Acknowledge immediately — Yoco expects 2xx within 15 s
http_response_code(200);
header('Content-Type: application/json');
echo json_encode(['received' => true]);

if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    if (ob_get_level()) { ob_end_flush(); }
    flush();
}

// ── Parse event ───────────────────────────────────────────────────────────────
$eventType = $event['type'] ?? '';
$payload   = $event['payload'] ?? $event; // some events nest under "payload"
$meta      = $payload['metadata'] ?? [];

$paymentStatus = $payload['status'] ?? '';
$paymentId     = $payload['id']     ?? '';
$checkoutId    = $meta['checkoutId']   ?? $meta['checkout_id'] ?? '';
$orderNumber   = $meta['order_number'] ?? '';

error_log("yoco-webhook: type={$eventType} status={$paymentStatus} order={$orderNumber} checkout={$checkoutId} payment={$paymentId}");

// Only act on successful payments
if ($eventType !== 'payment.succeeded' && $paymentStatus !== 'succeeded') {
    if ($eventType === 'payment.failed') {
        // Mark order failed if we can identify it
        if ($orderNumber !== '') {
            try {
                $db = getDB();
                $db->prepare('UPDATE orders SET payment_status = "failed", updated_at = NOW() WHERE order_number = ? AND payment_status = "pending"')
                   ->execute([$orderNumber]);
            } catch (Exception $e) {
                error_log('yoco-webhook (fail mark): ' . $e->getMessage());
            }
        }
    }
    exit;
}

if ($orderNumber === '' && $checkoutId === '') {
    error_log('yoco-webhook: cannot identify order — no order_number or checkoutId in metadata');
    exit;
}

try {
    $db = getDB();

    // Look up order — prefer order_number, fall back to checkout_id in payment_reference
    if ($orderNumber !== '') {
        $stmt = $db->prepare('SELECT * FROM orders WHERE order_number = ? LIMIT 1');
        $stmt->execute([$orderNumber]);
    } else {
        $stmt = $db->prepare('SELECT * FROM orders WHERE payment_reference = ? LIMIT 1');
        $stmt->execute([$checkoutId]);
    }
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        error_log("yoco-webhook: no order found for order_number={$orderNumber} checkout={$checkoutId}");
        exit;
    }

    // Idempotency guard
    if ($order['payment_status'] === 'paid') {
        error_log("yoco-webhook: order {$order['order_number']} already paid, skipping");
        exit;
    }

    $ref = $paymentId ?: $checkoutId;

    // Mark paid
    $db->prepare('
        UPDATE orders
        SET payment_status    = "paid",
            status            = "processing",
            payment_reference = ?,
            paid_at           = NOW(),
            updated_at        = NOW()
        WHERE id = ?
    ')->execute([$ref, (int)$order['id']]);

    // Record transaction
    if (hasTable($db, 'payment_transactions')) {
        $db->prepare('
            INSERT INTO payment_transactions
                (order_id, order_number, provider, status, gateway_reference, amount, currency, response_payload)
            VALUES (?, ?, "yoco", "paid", ?, ?, "ZAR", ?)
        ')->execute([
            (int)$order['id'],
            $order['order_number'],
            $ref,
            (int)$order['total_amount'],
            json_encode($event),
        ]);
    }

    // Send confirmation emails
    $updatedOrder                      = $order;
    $updatedOrder['payment_reference'] = $ref;

    $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
    $itemStmt->execute([(int)$order['id']]);
    $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

    sendCustomerOrderConfirmation($updatedOrder, $items);
    sendAdminOrderNotification($updatedOrder, $items);

    error_log("yoco-webhook: ✅ order {$order['order_number']} marked paid via webhook (ref={$ref})");

} catch (Exception $e) {
    error_log('yoco-webhook error: ' . $e->getMessage());
}
