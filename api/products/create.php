<?php
/**
 * Create Product (Admin Only)
 * POST /api/products/create.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';

// Only admins can create products
$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Get input
$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    // Generate SKU
    $sku = 'BIO-' . strtoupper(substr(uniqid(), -8));
    
    // Generate slug
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $data['name']), '-'));
    
    // Check if slug exists
    $stmt = $db->prepare("SELECT id FROM products WHERE slug = ?");
    $stmt->execute([$slug]);
    if ($stmt->fetch()) {
        $slug .= '-' . time();
    }
    $productData['slug'] = $slug;
    
    // Prepare data
    $productData = [
        'sku' => $sku,
        'name' => sanitize($data['name'] ?? ''),
        'slug' => $slug,
        'description' => sanitize($data['description'] ?? ''),
        'short_description' => sanitize($data['short_description'] ?? ''),
        'category_id' => isset($data['category_id']) ? (int)$data['category_id'] : null,
        'price' => (int)($data['price'] ?? 0),
        'compare_at_price' => isset($data['compare_at_price']) ? (int)$data['compare_at_price'] : null,
        'cost_price' => isset($data['cost_price']) ? (int)$data['cost_price'] : null,
        'specs' => json_encode($data['specs'] ?? []),
        'images' => json_encode($data['images'] ?? []),
        'featured_image' => $data['featured_image'] ?? null,
        'stock_quantity' => (int)($data['stock_quantity'] ?? 0),
        'low_stock_threshold' => (int)($data['low_stock_threshold'] ?? 5),
        'track_inventory' => ($data['track_inventory'] ?? true) ? 1 : 0,
        'grade' => in_array($data['grade'] ?? '', ['A', 'B', 'C']) ? $data['grade'] : 'A',
        'condition_notes' => sanitize($data['condition_notes'] ?? ''),
        'brand' => sanitize($data['brand'] ?? ''),
        'model' => sanitize($data['model'] ?? ''),
        'year_manufactured' => isset($data['year_manufactured']) ? (int)$data['year_manufactured'] : null,
        'serial_number' => sanitize($data['serial_number'] ?? ''),
        'meta_title' => sanitize($data['meta_title'] ?? ''),
        'meta_description' => sanitize($data['meta_description'] ?? ''),
        'tags' => json_encode($data['tags'] ?? []),
        'is_featured' => ($data['is_featured'] ?? false) ? 1 : 0,
        'rating' => (float)($data['rating'] ?? 5.0),
    ];
    
    // Insert product
    $fields = implode(', ', array_keys($productData));
    $placeholders = implode(', ', array_fill(0, count($productData), '?'));
    
    $stmt = $db->prepare("INSERT INTO products ($fields) VALUES ($placeholders)");
    $stmt->execute(array_values($productData));
    
    $productId = $db->lastInsertId();
    
    // Log inventory if stock > 0
    if ($productData['stock_quantity'] > 0) {
        $stmt = $db->prepare("
            INSERT INTO inventory_logs (product_id, user_id, change_type, quantity_before, quantity_after, quantity_changed, notes)
            VALUES (?, ?, 'add', 0, ?, ?, 'Initial stock')
        ");
        $stmt->execute([$productId, $currentUser['id'], $productData['stock_quantity'], $productData['stock_quantity']]);
    }
    
    // Log activity
    logActivity($currentUser['id'], 'product_created', 'products', $productId, null, $productData);
    
    jsonResponse([
        'success' => true,
        'message' => 'Product created successfully',
        'product_id' => $productId,
        'sku' => $sku
    ], 201);
    
} catch (PDOException $e) {
    error_log("Create product error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to create product'], 500);
}
