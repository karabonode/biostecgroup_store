<?php
/**
 * Get order status (no auth required — keyed by order_number).
 * GET /api/orders/status.php?order_number=ORD-...
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$orderNumber = trim($_GET['order_number'] ?? '');
if ($orderNumber === '') {
    jsonResponse(['error' => 'order_number is required'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare('
        SELECT order_number, payment_status, status, total_amount, shipping_cost,
               shipping_address, customer_name, created_at, paid_at
        FROM orders
        WHERE order_number = ?
        LIMIT 1
    ');
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['error' => 'Order not found'], 404);
    }

    $shipping = is_string($order['shipping_address'])
        ? json_decode($order['shipping_address'], true)
        : ($order['shipping_address'] ?? []);

    $deliveryMethod = ($shipping['fulfilment_method'] ?? '') === 'pickup' ? 'pickup' : 'courier';

    jsonResponse([
        'order_number'   => $order['order_number'],
        'payment_status' => $order['payment_status'],
        'status'         => $order['status'],
        'total_amount'   => (int)$order['total_amount'],
        'shipping_cost'  => (int)$order['shipping_cost'],
        'delivery_method'=> $deliveryMethod,
        'customer_name'  => $order['customer_name'],
        'created_at'     => $order['created_at'],
        'paid_at'        => $order['paid_at'],
    ]);

} catch (Exception $e) {
    error_log('status.php error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server error'], 500);
}
