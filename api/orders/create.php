<?php
/**
 * Create Order (checkout session created separately)
 * POST /api/orders/create.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../config/payment.php';

const PICKUP_LOCATION = [
    'store_name' => 'Biostec Group Johannesburg',
    'address' => 'Johannesburg Collection Point (Address shared after order confirmation)',
    'contact' => '+27 11 000 0000 / info@biostecgroup.co.za',
    'city' => 'Johannesburg',
    'province' => 'Gauteng',
    'postal_code' => '2000'
];

const MIN_YOCO_AMOUNT_CENTS = 5000;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Validate authentication
$currentUser = getCurrentUser();
if (!$currentUser) {
    jsonResponse(['error' => 'Unauthorized - Please log in to place an order', 'code' => 'AUTH_REQUIRED'], 401);
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    if (empty($data['items']) || !is_array($data['items'])) {
        jsonResponse(['error' => 'Order items are required'], 400);
    }
    
    if (empty($data['customer'])) {
        jsonResponse(['error' => 'Customer details are required'], 400);
    }

    $deliveryMethod = 'courier';
    if (!empty($data['delivery']) && is_array($data['delivery'])) {
        $deliveryMethod = isset($data['delivery']['method'])
            ? strtolower(trim((string)$data['delivery']['method']))
            : 'courier';
    }

    if (!in_array($deliveryMethod, ['courier', 'pickup'], true)) {
        jsonResponse(['error' => 'Invalid delivery method'], 400);
    }
    
    $customer = $data['customer'];

    $requiredCustomerFields = ['firstName', 'lastName', 'email', 'phone'];
    if ($deliveryMethod === 'courier') {
        $requiredCustomerFields = array_merge($requiredCustomerFields, ['address', 'city', 'province', 'postalCode']);
    }

    foreach ($requiredCustomerFields as $field) {
        if (!isset($customer[$field]) || trim((string)$customer[$field]) === '') {
            jsonResponse(['error' => 'Missing customer field: ' . $field], 400);
        }
    }

    if (!filter_var($customer['email'], FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Invalid customer email'], 400);
    }
    
    $orderItems = [];
    $subtotal = 0;

    $productStmt = $db->prepare('
        SELECT id, sku, name, price, grade, featured_image, specs, is_active, stock_quantity
        FROM products
        WHERE id = ?
        LIMIT 1
    ');

    foreach ($data['items'] as $item) {
        $productId = isset($item['productId']) ? (int)$item['productId'] : 0;
        $quantity = isset($item['quantity']) ? (int)$item['quantity'] : 0;

        if ($productId <= 0 || $quantity <= 0) {
            jsonResponse(['error' => 'Invalid order item'], 400);
        }

        $productStmt->execute([$productId]);
        $product = $productStmt->fetch(PDO::FETCH_ASSOC);

        if (!$product || (int)$product['is_active'] !== 1) {
            jsonResponse(['error' => 'One or more products are unavailable'], 400);
        }

        if ((int)$product['stock_quantity'] < $quantity) {
            jsonResponse(['error' => 'Insufficient stock for ' . $product['name']], 400);
        }

        // Product prices are managed in rand units in this codebase; convert to cents for order/payment math.
        $unitPrice = (int) round(((float)$product['price']) * 100);
        if ($unitPrice <= 0) {
            jsonResponse(['error' => 'Invalid product pricing for ' . $product['name']], 400);
        }

        $lineTotal = $unitPrice * $quantity;
        $subtotal += $lineTotal;

        $orderItems[] = [
            'product_id' => $productId,
            'product_name' => $product['name'],
            'product_sku' => $product['sku'] ?? null,
            'product_image' => $product['featured_image'] ?? null,
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'total_price' => $lineTotal,
            'grade' => $product['grade'] ?? 'A',
            'specs_snapshot' => $product['specs'] ?? null,
        ];
    }

    if ($subtotal <= 0) {
        jsonResponse(['error' => 'Invalid order subtotal'], 400);
    }

    $shippingCost = 0;
    if ($deliveryMethod === 'courier') {
        $shippingCost = $subtotal > 500000 ? 0 : 15000;
    }

    $totalAmount = $subtotal + $shippingCost;
    if ($totalAmount < MIN_YOCO_AMOUNT_CENTS) {
        jsonResponse([
            'error' => 'Order total is too low for Yoco checkout. Minimum payable amount is R50.00.'
        ], 400);
    }

    $db->beginTransaction();
    $orderNumber = 'ORD-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));
    
    if ($deliveryMethod === 'pickup') {
        $shippingAddress = json_encode([
            'fulfilment_method' => 'pickup',
            'pickup_store_name' => PICKUP_LOCATION['store_name'],
            'pickup_address' => PICKUP_LOCATION['address'],
            'pickup_contact' => PICKUP_LOCATION['contact'],
            'street' => PICKUP_LOCATION['address'],
            'city' => PICKUP_LOCATION['city'],
            'province' => PICKUP_LOCATION['province'],
            'postal_code' => PICKUP_LOCATION['postal_code'],
            'courier_name' => null
        ]);
    } else {
        $shippingAddress = json_encode([
            'fulfilment_method' => 'courier',
            'street' => $customer['address'],
            'city' => $customer['city'],
            'province' => $customer['province'],
            'postal_code' => $customer['postalCode'],
            'courier_name' => 'The Courier Guy'
        ]);
    }
    
    $customerName = $customer['firstName'] . ' ' . $customer['lastName'];
    
    $stmt = $db->prepare("
        INSERT INTO orders (order_number, user_id, status, payment_status, subtotal, shipping_cost, total_amount,
            shipping_address, customer_email, customer_phone, customer_name, payment_method, created_at)
        VALUES (?, ?, 'pending', 'pending', ?, ?, ?, ?, ?, ?, ?, 'yoco', NOW())
    ");
    
    $stmt->execute([
        $orderNumber, (int)$currentUser['id'], $subtotal, $shippingCost, $totalAmount,
        $shippingAddress, sanitize($customer['email']), sanitize($customer['phone']),
        sanitize($customerName)
    ]);
    
    $orderId = (int)$db->lastInsertId();

    $itemColumns = ['order_id', 'product_id', 'product_name', 'unit_price', 'quantity', 'total_price'];
    if (hasTableColumn($db, 'order_items', 'product_sku')) {
        $itemColumns[] = 'product_sku';
    }
    if (hasTableColumn($db, 'order_items', 'product_image')) {
        $itemColumns[] = 'product_image';
    }
    if (hasTableColumn($db, 'order_items', 'grade')) {
        $itemColumns[] = 'grade';
    }
    if (hasTableColumn($db, 'order_items', 'specs_snapshot')) {
        $itemColumns[] = 'specs_snapshot';
    }

    $itemPlaceholders = implode(', ', array_fill(0, count($itemColumns), '?'));
    $itemSql = 'INSERT INTO order_items (' . implode(', ', $itemColumns) . ') VALUES (' . $itemPlaceholders . ')';
    $stmtItem = $db->prepare($itemSql);

    foreach ($orderItems as $item) {
        $itemParams = [];
        foreach ($itemColumns as $col) {
            if ($col === 'order_id') {
                $itemParams[] = $orderId;
                continue;
            }

            $itemParams[] = $item[$col] ?? null;
        }

        $stmtItem->execute($itemParams);
    }
    
    $db->commit();
    
    jsonResponse([
        'success' => true,
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'delivery_method' => $deliveryMethod,
        'shipping_cost' => $shippingCost,
        'total_amount' => $totalAmount,
        'currency' => 'ZAR'
    ], 201);
    
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    error_log("Create order error: " . $e->getMessage());
    jsonResponse(['error' => $e->getMessage()], 500);
}

