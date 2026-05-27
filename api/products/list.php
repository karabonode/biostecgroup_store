<?php
/**
 * Get Products List
 * GET /api/products/list.php
 * Query params: grade, category, search, min_price, max_price, in_stock, featured
 */

require_once '../config/database.php';

function normalizeAssetUrl($url) {
    if (!is_string($url) || trim($url) === '') {
        return $url;
    }

    $trimmed = trim($url);
    $forwardedProto = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || $forwardedProto === 'https';
    $scheme = $isHttps ? 'https' : 'http';
    $currentHost = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000';

    // Relative path — expand to full URL using this server's host
    if (strpos($trimmed, '/') === 0) {
        $path = $trimmed;
        // Strip any stale project-folder prefix (e.g. /biostecgroup-1/api/uploads/)
        if (preg_match('#^/[^/]+/api/uploads/#', $path)) {
            $path = preg_replace('#^/[^/]+(/api/uploads/)#', '$1', $path);
        }
        return $scheme . '://' . $currentHost . $path;
    }

    if (strpos($trimmed, 'http://') !== 0 && strpos($trimmed, 'https://') !== 0) {
        return $trimmed;
    }

    $parts = parse_url($trimmed);
    if (!$parts || empty($parts['host'])) {
        return $trimmed;
    }

    $host = strtolower($parts['host']);
    $path = $parts['path'] ?? '';
    $query = isset($parts['query']) ? ('?' . $parts['query']) : '';

    // Normalise any localhost/127.0.0.1 URL to the current server host
    if ($host === '127.0.0.1' || $host === 'localhost') {
        if ($currentHost === '' || $path === '') {
            return $trimmed;
        }
        $host = $currentHost;
    }

    // Strip any stale project-folder prefix (e.g. /biostecgroup-1/api/uploads/)
    if (preg_match('#^/[^/]+/api/uploads/#', $path)) {
        $path = preg_replace('#^/[^/]+(/api/uploads/)#', '$1', $path);
    }

    return $scheme . '://' . $host . $path . $query;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

try {
    $db = getDB();
    
    // Build query
    $where = ['p.is_active = 1'];
    $params = [];
    
    // Grade filter
    if (isset($_GET['grade']) && in_array($_GET['grade'], ['A', 'B', 'C'])) {
        $where[] = 'grade = ?';
        $params[] = $_GET['grade'];
    }
    
    // Category filter
    if (isset($_GET['category']) && is_numeric($_GET['category'])) {
        $where[] = 'category_id = ?';
        $params[] = $_GET['category'];
    }
    
    // Price filters
    if (isset($_GET['min_price']) && is_numeric($_GET['min_price'])) {
        $where[] = 'price >= ?';
        $params[] = $_GET['min_price'];
    }
    if (isset($_GET['max_price']) && is_numeric($_GET['max_price'])) {
        $where[] = 'price <= ?';
        $params[] = $_GET['max_price'];
    }
    
    // In stock filter
    if (isset($_GET['in_stock']) && $_GET['in_stock'] === 'true') {
        $where[] = 'stock_quantity > 0';
    }
    
    // Featured filter
    if (isset($_GET['featured']) && $_GET['featured'] === 'true') {
        $where[] = 'is_featured = 1';
    }
    
    // Search
    if (isset($_GET['search']) && !empty($_GET['search'])) {
        $where[] = '(name LIKE ? OR description LIKE ? OR sku LIKE ?)';
        $searchTerm = '%' . $_GET['search'] . '%';
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Get products
    $stmt = $db->prepare("
        SELECT p.*, c.name as category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE $whereClause
        ORDER BY p.is_featured DESC, p.created_at DESC
    ");
    $stmt->execute($params);
    $products = $stmt->fetchAll();
    
    // Parse JSON fields
    foreach ($products as &$product) {
        $product['specs'] = json_decode($product['specs'], true);
        $product['images'] = json_decode($product['images'], true);
        $product['tags'] = json_decode($product['tags'], true);
        $product['price'] = (int) $product['price'];
        $product['stock_quantity'] = (int) $product['stock_quantity'];

        if (is_array($product['images'])) {
            $product['images'] = array_map('normalizeAssetUrl', $product['images']);
        }
        $product['featured_image'] = normalizeAssetUrl($product['featured_image'] ?? null);
    }
    
    jsonResponse([
        'success' => true,
        'count' => count($products),
        'data' => $products
    ]);
    
} catch (PDOException $e) {
    error_log("Products list error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch products'], 500);
}
