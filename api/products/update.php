<?php
/**
 * Update Product (Admin Only)
 * PUT /api/products/update.php?id=PRODUCT_ID
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$productId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$productId) {
    jsonResponse(['error' => 'Product ID required'], 400);
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    // Get old product data for logging
    $stmt = $db->prepare("SELECT * FROM products WHERE id = ?");
    $stmt->execute([$productId]);
    $oldProduct = $stmt->fetch();
    
    if (!$oldProduct) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    // Build update data
    $updates = [];
    $params = [];
    
    $fields = [
        'name', 'description', 'short_description', 'category_id', 'price',
        'compare_at_price', 'cost_price', 'featured_image', 'stock_quantity',
        'low_stock_threshold', 'grade', 'condition_notes', 'brand', 'model',
        'year_manufactured', 'serial_number', 'meta_title', 'meta_description',
        'is_featured', 'is_active', 'rating', 'review_count'
    ];
    
    foreach ($fields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = ?";
            if (in_array($field, ['price', 'compare_at_price', 'cost_price', 'category_id', 'stock_quantity', 'low_stock_threshold', 'year_manufactured', 'review_count'])) {
                $params[] = (int)$data[$field];
            } elseif (in_array($field, ['category_id', 'stock_quantity', 'low_stock_threshold', 'year_manufactured'])) {
                $params[] = $data[$field] ? (int)$data[$field] : null;
            } elseif (in_array($field, ['is_featured', 'is_active'])) {
                $params[] = $data[$field] ? 1 : 0;
            } elseif ($field === 'rating') {
                $params[] = (float)$data[$field];
            } else {
                $params[] = sanitize($data[$field]);
            }
        }
    }
    
    // Handle JSON fields
    if (isset($data['specs'])) {
        $updates[] = "specs = ?";
        $params[] = json_encode($data['specs']);
    }
    if (isset($data['images'])) {
        $updates[] = "images = ?";
        $params[] = json_encode($data['images']);
    }
    if (isset($data['tags'])) {
        $updates[] = "tags = ?";
        $params[] = json_encode($data['tags']);
    }
    
    // Handle slug if name changed
    if (isset($data['name']) && $data['name'] !== $oldProduct['name']) {
        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name']), '-'));
        $stmt = $db->prepare("SELECT id FROM products WHERE slug = ? AND id != ?");
        $stmt->execute([$slug, $productId]);
        if ($stmt->fetch()) {
            $slug .= '-' . time();
        }
        $updates[] = "slug = ?";
        $params[] = $slug;
    }
    
    // Handle inventory change
    if (isset($data['stock_quantity']) && $data['stock_quantity'] != $oldProduct['stock_quantity']) {
        $change = $data['stock_quantity'] - $oldProduct['stock_quantity'];
        $stmt = $db->prepare("
            INSERT INTO inventory_logs (product_id, user_id, change_type, quantity_before, quantity_after, quantity_changed, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $productId,
            $currentUser['id'],
            $change > 0 ? 'adjust' : 'adjust',
            $oldProduct['stock_quantity'],
            $data['stock_quantity'],
            abs($change),
            'Manual adjustment'
        ]);
    }
    
    if (empty($updates)) {
        jsonResponse(['error' => 'No data to update'], 400);
    }
    
    $params[] = $productId;
    $updateStr = implode(', ', $updates);
    
    $stmt = $db->prepare("UPDATE products SET $updateStr WHERE id = ?");
    $stmt->execute($params);
    
    // Log activity
    logActivity($currentUser['id'], 'product_updated', 'products', $productId, $oldProduct, $data);
    
    jsonResponse([
        'success' => true,
        'message' => 'Product updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Update product error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to update product'], 500);
}
