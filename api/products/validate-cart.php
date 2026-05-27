<?php
/**
 * Validate cart item prices against current database values.
 * POST /api/products/validate-cart.php
 * Body: { "items": [{ "id": "1", "priceCents": 50000 }, ...] }
 * Returns: { "success": true, "stale": [{ id, name, oldPriceCents, newPriceCents }] }
 * No authentication required — product prices are public.
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data  = json_decode(file_get_contents('php://input'), true);
$items = isset($data['items']) && is_array($data['items']) ? $data['items'] : [];

if (empty($items)) {
    jsonResponse(['success' => true, 'stale' => []]);
}

// Build list of integer IDs for the query
$ids = array_filter(
    array_map(function ($item) { return (int)($item['id'] ?? 0); }, $items),
    function ($id) { return $id > 0; }
);

if (empty($ids)) {
    jsonResponse(['success' => true, 'stale' => []]);
}

try {
    $db = getDB();

    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = $db->prepare("SELECT id, name, price FROM products WHERE id IN ($placeholders) AND is_active = 1");
    $stmt->execute(array_values($ids));
    $current = $stmt->fetchAll();

    // Key by id for quick lookup
    $byId = [];
    foreach ($current as $row) {
        $byId[(string)$row['id']] = $row;
    }

    $stale = [];
    foreach ($items as $item) {
        $id           = (string)($item['id'] ?? '');
        $clientCents  = (int)($item['priceCents'] ?? 0);

        if (!isset($byId[$id])) continue;

        $dbCents = (int)$byId[$id]['price'] * 100; // DB stores Rands; frontend uses cents

        if ($dbCents !== $clientCents) {
            $stale[] = [
                'id'            => $id,
                'name'          => $byId[$id]['name'],
                'oldPriceCents' => $clientCents,
                'newPriceCents' => $dbCents,
            ];
        }
    }

    jsonResponse(['success' => true, 'stale' => $stale]);

} catch (PDOException $e) {
    error_log('validate-cart error: ' . $e->getMessage());
    jsonResponse(['error' => 'Price validation failed'], 500);
}
