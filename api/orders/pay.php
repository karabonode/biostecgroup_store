<?php
/**
 * Initiate a Yoco hosted-checkout for a pending order.
 * POST /api/orders/pay.php
 * Body: { "order_number": "ORD-...", "success_url": "...", "cancel_url": "..." }
 * Auth: Bearer <jwt>
 */

require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/payment.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$currentUser = requireAuth();

$data        = json_decode(file_get_contents('php://input'), true) ?? [];
$orderNumber = trim($data['order_number'] ?? '');
$successUrl  = trim($data['success_url']  ?? '');
$cancelUrl   = trim($data['cancel_url']   ?? '');

if ($orderNumber === '') {
    jsonResponse(['error' => 'order_number is required'], 400);
}

// Default URLs pointing to the React app
if ($successUrl === '') {
    $origin     = (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'http://localhost:3001';
    $successUrl = $origin . '/checkout/success?order=' . urlencode($orderNumber);
    $cancelUrl  = $origin . '/checkout';
}

// Auto-rewrite HTTP to HTTPS for live Yoco keys (required by Yoco for live keys)
$isLiveKey = strpos(YOCO_SECRET_KEY, 'sk_live_') === 0;
if ($isLiveKey) {
    $successUrl = str_replace('http://', 'https://', $successUrl);
    $cancelUrl = str_replace('http://', 'https://', $cancelUrl);
}

try {
    $db = getDB();

    // Fetch order — must belong to current user
    $stmt = $db->prepare('SELECT * FROM orders WHERE order_number = ? AND user_id = ? LIMIT 1');
    $stmt->execute([$orderNumber, (int)$currentUser['id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        // Debug: log why order wasn't found
        error_log("DEBUG: Order not found - order_number=$orderNumber, user_id=" . $currentUser['id']);
        jsonResponse(['error' => 'Order not found'], 404);
    }

    // Idempotency — already has a redirect URL stored
    if ($order['payment_status'] === 'paid') {
        jsonResponse(['success' => true, 'order_number' => $orderNumber, 'already_paid' => true]);
    }

    // Create Yoco hosted checkout
    $metadata = [
        'order_number' => $order['order_number'],
        'customer'     => $order['customer_name'],
        'email'        => $order['customer_email'],
    ];

    $checkout = yocoCreateCheckout(
        (int)$order['total_amount'],
        'ZAR',
        $successUrl,
        $cancelUrl,
        $metadata
    );

    if (!$checkout['success']) {
        jsonResponse(['error' => $checkout['error'] ?? 'Could not create payment session'], 502);
    }

    // Store checkout_id in payment_reference so verify.php can look it up
    $db->prepare('UPDATE orders SET payment_reference = ?, updated_at = NOW() WHERE id = ?')
       ->execute([$checkout['id'], (int)$order['id']]);

    jsonResponse([
        'success'      => true,
        'order_number' => $orderNumber,
        'redirect_url' => $checkout['redirectUrl'],
        'checkout_id'  => $checkout['id'],
    ]);

} catch (Exception $e) {
    error_log('pay.php error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server error'], 500);
}
