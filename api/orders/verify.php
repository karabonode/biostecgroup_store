<?php
/**
 * Verify a Yoco payment after the user is redirected back from Yoco.
 * GET /api/orders/verify.php?order_number=ORD-...
 * No auth required — keyed by order_number (not guessable externally).
 */

require_once '../config/database.php';
require_once '../config/payment.php';
require_once '../email/order_notifications.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$orderNumber = trim($_GET['order_number'] ?? '');
if ($orderNumber === '') {
    jsonResponse(['error' => 'order_number is required'], 400);
}

try {
    $db   = getDB();
    $stmt = $db->prepare('SELECT * FROM orders WHERE order_number = ? LIMIT 1');
    $stmt->execute([$orderNumber]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        jsonResponse(['error' => 'Order not found'], 404);
    }

    // Already confirmed paid — return immediately
    if ($order['payment_status'] === 'paid') {
        jsonResponse([
            'success'        => true,
            'payment_status' => 'paid',
            'order_number'   => $orderNumber,
            'already_paid'   => true,
        ]);
    }

    $checkoutId = $order['payment_reference'] ?? '';
    if ($checkoutId === '') {
        jsonResponse(['error' => 'No checkout session found for this order'], 400);
    }

    // Ask Yoco for the current checkout status
    $yocoStatus = yocoGetCheckout($checkoutId);

    if (!$yocoStatus['success']) {
        jsonResponse(['error' => 'Could not verify payment: ' . ($yocoStatus['error'] ?? 'unknown')], 502);
    }

    $status = $yocoStatus['status'] ?? 'unknown';  // 'created' | 'pending' | 'completed' | 'failed'

    if ($status === 'complete' || $status === 'completed') {
        // Mark order as paid
        $db->prepare('
            UPDATE orders
            SET payment_status    = "paid",
                status            = "processing",
                payment_reference = ?,
                paid_at           = NOW(),
                updated_at        = NOW()
            WHERE id = ?
        ')->execute([$checkoutId, (int)$order['id']]);

        // Record in payment_transactions if table exists
        if (hasTable($db, 'payment_transactions')) {
            $db->prepare('
                INSERT INTO payment_transactions
                    (order_id, order_number, provider, status, gateway_reference, amount, currency, response_payload)
                VALUES (?, ?, "yoco", "paid", ?, ?, "ZAR", ?)
            ')->execute([
                (int)$order['id'],
                $orderNumber,
                $checkoutId,
                (int)$order['total_amount'],
                json_encode($yocoStatus['data']),
            ]);
        }

        // Send emails (soft-fail)
        $updatedOrder                      = $order;
        $updatedOrder['payment_reference'] = $checkoutId;
        $itemStmt = $db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $itemStmt->execute([(int)$order['id']]);
        $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

        sendCustomerOrderConfirmation($updatedOrder, $items);
        sendAdminOrderNotification($updatedOrder, $items);

        jsonResponse([
            'success'        => true,
            'payment_status' => 'paid',
            'order_number'   => $orderNumber,
        ]);

    } elseif ($status === 'failed' || $status === 'cancelled') {
        $db->prepare('UPDATE orders SET payment_status = "failed", updated_at = NOW() WHERE id = ?')
           ->execute([(int)$order['id']]);

        jsonResponse([
            'success'        => false,
            'payment_status' => $status,
            'order_number'   => $orderNumber,
            'error'          => 'Payment ' . $status,
        ], 402);

    } else {
        // Still pending (user may not have paid yet)
        jsonResponse([
            'success'        => false,
            'payment_status' => $status,
            'order_number'   => $orderNumber,
            'error'          => 'Payment not yet completed (status: ' . $status . ')',
        ], 202);
    }

} catch (Exception $e) {
    error_log('verify.php error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server error'], 500);
}
