<?php
/**
 * Get Orders List (Admin Only)
 * GET /api/orders/list.php
 * Query params: status, user_id, search
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAuth();
$isAdmin = ($currentUser['role'] ?? '') === 'admin';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $db = getDB();
    
    // Build query
    $where = ['1=1'];
    $params = [];

    // Non-admin users can only see their own orders
    if (!$isAdmin) {
        $where[] = 'o.user_id = ?';
        $params[] = (int)$currentUser['id'];
    }
    
    // Status filter
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $where[] = 'o.status = ?';
        $params[] = $_GET['status'];
    }
    
    // Payment status filter
    if (isset($_GET['payment_status']) && !empty($_GET['payment_status'])) {
        $where[] = 'o.payment_status = ?';
        $params[] = $_GET['payment_status'];
    }
    
    // User filter
    if ($isAdmin && isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        $where[] = 'o.user_id = ?';
        $params[] = $_GET['user_id'];
    }
    
    // Search by order number or customer
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $where[] = '(o.order_number LIKE ? OR o.customer_name LIKE ? OR o.customer_email LIKE ?)';
        $searchTerm = '%' . $_GET['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get orders
    $stmt = $db->prepare("
        SELECT o.*, 
               u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE $whereClause
        ORDER BY o.created_at DESC
    ");
    $stmt->execute($params);
    $orders = $stmt->fetchAll();
    
    // Get order items for each order
    foreach ($orders as &$order) {
        $stmtItems = $db->prepare("
            SELECT * FROM order_items WHERE order_id = ?
        ");
        $stmtItems->execute([$order['id']]);
        $order['items'] = $stmtItems->fetchAll();
        $order['shipping_address'] = json_decode($order['shipping_address'], true);
    }
    
    jsonResponse([
        'success' => true,
        'count' => count($orders),
        'data' => $orders
    ]);
    
} catch (PDOException $e) {
    error_log("Orders list error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch orders'], 500);
}
