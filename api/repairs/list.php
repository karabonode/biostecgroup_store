<?php
/**
 * Get Repair Tickets List (Admin Only)
 * GET /api/repairs/list.php
 * Query params: status, priority, user_id, search
 */

require_once '../config/database.php';
require_once '../config/auth.php';

// Only admins can access all repair tickets
$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $db = getDB();
    
    // Build query
    $where = ['1=1'];
    $params = [];
    
    // Status filter
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $where[] = 'r.status = ?';
        $params[] = $_GET['status'];
    }
    
    // Priority filter
    if (isset($_GET['priority']) && !empty($_GET['priority'])) {
        $where[] = 'r.priority = ?';
        $params[] = $_GET['priority'];
    }
    
    // User filter
    if (isset($_GET['user_id']) && is_numeric($_GET['user_id'])) {
        $where[] = 'r.user_id = ?';
        $params[] = $_GET['user_id'];
    }
    
    // Search by ticket number or customer
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $where[] = '(r.ticket_number LIKE ? OR r.customer_name LIKE ? OR r.customer_email LIKE ? OR r.device_model LIKE ?)';
        $searchTerm = '%' . $_GET['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get repair tickets
    $stmt = $db->prepare("
        SELECT r.*, 
               u.first_name as user_first_name, u.last_name as user_last_name, u.email as user_email
        FROM repair_tickets r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE $whereClause
        ORDER BY 
            CASE r.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END,
            r.created_at DESC
    ");
    $stmt->execute($params);
    $tickets = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'count' => count($tickets),
        'data' => $tickets
    ]);
    
} catch (PDOException $e) {
    error_log("Repair tickets list error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch repair tickets'], 500);
}
