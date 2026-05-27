<?php
/**
 * Get Single Product Detail
 * GET /api/products/detail.php?id=PRODUCT_ID
 * or GET /api/products/detail.php?slug=product-slug
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

    if ($host === '127.0.0.1' || $host === 'localhost') {
        if ($currentHost === '' || $path === '') {
            return $trimmed;
        }
        $host = $currentHost;
    }

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
    
    $productId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    $slug = isset($_GET['slug']) ? sanitize($_GET['slug']) : '';
    
    if (!$productId && empty($slug)) {
        jsonResponse(['error' => 'Product ID or slug required'], 400);
    }
    
    if ($productId) {
        $stmt = $db->prepare("
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ? AND p.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$productId]);
    } else {
        $stmt = $db->prepare("
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.slug = ? AND p.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([$slug]);
    }
    
    $product = $stmt->fetch();
    
    if (!$product) {
        jsonResponse(['error' => 'Product not found'], 404);
    }
    
    // Parse JSON fields
    $product['specs'] = json_decode($product['specs'], true);
    $product['images'] = json_decode($product['images'], true);
    $product['tags'] = json_decode($product['tags'], true);
    $product['price'] = (int) $product['price'];
    $product['stock_quantity'] = (int) $product['stock_quantity'];

    if (is_array($product['images'])) {
        $product['images'] = array_map('normalizeAssetUrl', $product['images']);
    }
    $product['featured_image'] = normalizeAssetUrl($product['featured_image'] ?? null);
    
    jsonResponse([
        'success' => true,
        'data' => $product
    ]);
    
} catch (PDOException $e) {
    error_log("Product detail error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch product'], 500);
}
