<?php
/**
 * Admin User Management
 * GET  /api/admin/users.php                          → list customers with stats
 * GET  /api/admin/users.php?action=orders&user_id=X  → orders for a user
 * POST /api/admin/users.php  { action, user_id }     → block | unblock | delete
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAdmin();

try {
    $db     = getDB();
    $method = $_SERVER['REQUEST_METHOD'];

    // ── GET ───────────────────────────────────────────────────────────────────
    if ($method === 'GET') {
        $action = $_GET['action'] ?? 'list';

        // Orders for a specific user
        if ($action === 'orders') {
            $userId = (int)($_GET['user_id'] ?? 0);
            if (!$userId) jsonResponse(['error' => 'user_id required'], 400);

            $stmt = $db->prepare("
                SELECT order_number, total_amount, status, payment_status, created_at,
                       (SELECT COUNT(*) FROM order_items WHERE order_id = orders.id) AS item_count
                FROM orders
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT 30
            ");
            $stmt->execute([$userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as &$r) {
                $r['total_amount'] = round($r['total_amount'] / 100, 2);
                $r['item_count']   = (int)$r['item_count'];
            }
            jsonResponse(['success' => true, 'orders' => $rows]);
        }

        // List all customers
        $stmt = $db->query("
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone,
                   u.email_verified, u.is_active, u.created_at, u.last_login,
                   COUNT(o.id)                                                             AS order_count,
                   COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN o.total_amount ELSE 0 END), 0) AS total_spent
            FROM users u
            LEFT JOIN orders o ON o.user_id = u.id
            WHERE u.role = 'customer'
            GROUP BY u.id
            ORDER BY u.created_at DESC
            LIMIT 500
        ");
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as &$u) {
            $u['email_verified'] = (bool)$u['email_verified'];
            $u['is_active']      = (bool)$u['is_active'];
            $u['order_count']    = (int)$u['order_count'];
            $u['total_spent']    = round($u['total_spent'] / 100, 2);
        }
        jsonResponse(['success' => true, 'users' => $users]);
    }

    // ── POST ──────────────────────────────────────────────────────────────────
    if ($method === 'POST') {
        $body   = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $body['action'] ?? '';
        $userId = (int)($body['user_id'] ?? 0);

        if (!$userId)  jsonResponse(['error' => 'user_id required'], 400);
        if (!$action)  jsonResponse(['error' => 'action required'],  400);

        // Safety checks
        $stmt = $db->prepare("SELECT id, role FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $target = $stmt->fetch();
        if (!$target)                   jsonResponse(['error' => 'User not found'], 404);
        if ($target['role'] === 'admin') jsonResponse(['error' => 'Cannot modify admin accounts'], 403);
        if ($userId === (int)$currentUser['id']) jsonResponse(['error' => 'Cannot modify your own account'], 403);

        switch ($action) {
            case 'block':
                $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$userId]);
                jsonResponse(['success' => true, 'message' => 'User blocked']);

            case 'unblock':
                $db->prepare("UPDATE users SET is_active = 1 WHERE id = ?")->execute([$userId]);
                jsonResponse(['success' => true, 'message' => 'User unblocked']);

            case 'delete':
                $stmt = $db->prepare("SELECT COUNT(*) FROM orders WHERE user_id = ?");
                $stmt->execute([$userId]);
                $hasOrders = (int)$stmt->fetchColumn() > 0;
                if ($hasOrders) {
                    // Preserve order history — block instead of hard delete
                    $db->prepare("UPDATE users SET is_active = 0 WHERE id = ?")->execute([$userId]);
                    jsonResponse(['success' => true, 'message' => 'Account blocked (has orders — history preserved)', 'action_taken' => 'blocked']);
                } else {
                    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
                    jsonResponse(['success' => true, 'message' => 'User deleted', 'action_taken' => 'deleted']);
                }

            default:
                jsonResponse(['error' => 'Invalid action'], 400);
        }
    }

    jsonResponse(['error' => 'Method not allowed'], 405);

} catch (PDOException $e) {
    error_log('admin/users.php error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server error'], 500);
}
