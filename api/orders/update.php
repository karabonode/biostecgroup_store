<?php
/**
 * Update Order Status (Admin Only)
 * PUT /api/orders/update.php?id=ORDER_ID
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$orderId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$orderId) {
    jsonResponse(['error' => 'Order ID required'], 400);
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    // Check if order exists
    $stmt = $db->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
    
    if (!$order) {
        jsonResponse(['error' => 'Order not found'], 404);
    }
    
    // Build update data
    $updates = [];
    $params = [];
    
    // Status update
    if (isset($data['status']) && in_array($data['status'], ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])) {
        $updates[] = "status = ?";
        $params[] = $data['status'];
        
        // Set timestamps based on status
        if ($data['status'] === 'shipped' && empty($order['shipped_at'])) {
            $updates[] = "shipped_at = NOW()";
        }
        if ($data['status'] === 'delivered' && empty($order['delivered_at'])) {
            $updates[] = "delivered_at = NOW()";
        }
    }
    
    // Payment status update
    if (isset($data['payment_status']) && in_array($data['payment_status'], ['pending', 'paid', 'failed', 'refunded'])) {
        $updates[] = "payment_status = ?";
        $params[] = $data['payment_status'];
        
        if ($data['payment_status'] === 'paid' && empty($order['paid_at'])) {
            $updates[] = "paid_at = NOW()";
        }
    }
    
    // Tracking number
    if (isset($data['tracking_number'])) {
        $updates[] = "tracking_number = ?";
        $params[] = sanitize($data['tracking_number']);
    }
    
    // Admin notes
    if (isset($data['admin_notes'])) {
        $updates[] = "admin_notes = ?";
        $params[] = sanitize($data['admin_notes']);
    }
    
    if (empty($updates)) {
        jsonResponse(['error' => 'No data to update'], 400);
    }
    
    $params[] = $orderId;
    $updateStr = implode(', ', $updates);
    
    $stmt = $db->prepare("UPDATE orders SET $updateStr WHERE id = ?");
    $stmt->execute($params);
    
    // Log activity
    logActivity($currentUser['id'], 'order_updated', 'orders', $orderId, $order, $data);
    
    jsonResponse([
        'success' => true,
        'message' => 'Order updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Update order error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to update order'], 500);
}
