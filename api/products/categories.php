<?php
/**
 * Get all product categories
 * GET /api/products/categories.php
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $db = getDB();
    
    $stmt = $db->prepare("
        SELECT id, name, slug, description, icon, sort_order, is_active
        FROM categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
    ");
    $stmt->execute();
    $categories = $stmt->fetchAll();
    
    jsonResponse([
        'success' => true,
        'categories' => $categories
    ]);
    
} catch (PDOException $e) {
    error_log("Categories fetch error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch categories'], 500);
}
