<?php
/**
 * Admin Dashboard Stats
 * GET /api/admin/stats.php
 * Returns revenue (in rands), order breakdown, product summary, recent orders.
 * All monetary amounts stored in cents — divided by 100 before returning.
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAdmin();

try {
    $db = getDB();

    // ── Revenue ───────────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COALESCE(SUM(total_amount), 0)                                        AS all_time,
            COALESCE(SUM(CASE WHEN MONTH(paid_at) = MONTH(NOW())
                               AND YEAR(paid_at)  = YEAR(NOW())
                          THEN total_amount END), 0)                              AS this_month,
            COALESCE(SUM(CASE WHEN MONTH(paid_at) = MONTH(NOW() - INTERVAL 1 MONTH)
                               AND YEAR(paid_at)  = YEAR(NOW() - INTERVAL 1 MONTH)
                          THEN total_amount END), 0)                              AS last_month
        FROM orders
        WHERE payment_status = 'paid'
    ");
    $rev = $stmt->fetch();
    $revenue = [
        'all_time'   => round($rev['all_time']   / 100, 2),
        'this_month' => round($rev['this_month'] / 100, 2),
        'last_month' => round($rev['last_month'] / 100, 2),
        'growth_pct' => $rev['last_month'] > 0
            ? round((($rev['this_month'] - $rev['last_month']) / $rev['last_month']) * 100, 1)
            : null,
    ];

    // ── Orders ────────────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COUNT(*)                                                              AS total,
            SUM(status      = 'pending')                                         AS pending,
            SUM(status      = 'processing')                                      AS processing,
            SUM(status      = 'shipped')                                         AS shipped,
            SUM(status      = 'delivered')                                       AS delivered,
            SUM(status      = 'cancelled')                                       AS cancelled,
            SUM(status      = 'refunded')                                        AS refunded,
            SUM(payment_status = 'paid')                                         AS paid,
            SUM(payment_status = 'pending' AND status NOT IN ('cancelled','refunded')) AS pending_payment
        FROM orders
    ");
    $o = $stmt->fetch();
    $orders = [
        'total'           => (int)$o['total'],
        'pending'         => (int)$o['pending'],
        'processing'      => (int)$o['processing'],
        'shipped'         => (int)$o['shipped'],
        'delivered'       => (int)$o['delivered'],
        'cancelled'       => (int)$o['cancelled'],
        'refunded'        => (int)$o['refunded'],
        'paid'            => (int)$o['paid'],
        'pending_payment' => (int)$o['pending_payment'],
    ];

    // ── Products ──────────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COUNT(*)                                                              AS total,
            SUM(stock_quantity <= low_stock_threshold AND stock_quantity > 0)    AS low_stock,
            SUM(stock_quantity = 0)                                               AS out_of_stock
        FROM products WHERE is_active = 1
    ");
    $p = $stmt->fetch();

    $stmt = $db->query("
        SELECT c.name AS category, COUNT(p.id) AS count
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
        WHERE c.is_active = 1
        GROUP BY c.id, c.name
        ORDER BY count DESC
    ");
    $byCategory = $stmt->fetchAll();

    $products = [
        'total'        => (int)$p['total'],
        'low_stock'    => (int)$p['low_stock'],
        'out_of_stock' => (int)$p['out_of_stock'],
        'by_category'  => $byCategory,
    ];

    // ── Customers ─────────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COUNT(*)                                                              AS total,
            SUM(MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) AS new_this_month
        FROM users WHERE role = 'customer'
    ");
    $c = $stmt->fetch();
    $customers = [
        'total'          => (int)$c['total'],
        'new_this_month' => (int)$c['new_this_month'],
    ];

    // ── Repair Tickets ────────────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT
            COUNT(*)                                                              AS total,
            SUM(status = 'pending')                                              AS pending,
            SUM(status IN ('diagnosing','waiting_parts','repairing'))            AS in_progress,
            SUM(status = 'ready')                                                AS ready
        FROM repair_tickets
    ");
    $r = $stmt->fetch();
    $repairs = [
        'total'       => (int)$r['total'],
        'pending'     => (int)$r['pending'],
        'in_progress' => (int)$r['in_progress'],
        'ready'       => (int)$r['ready'],
    ];

    // ── Recent Orders (last 8) ────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT order_number, customer_name, customer_email,
               total_amount, status, payment_status, created_at
        FROM orders
        ORDER BY created_at DESC
        LIMIT 8
    ");
    $recentRaw = $stmt->fetchAll();
    $recentOrders = array_map(function ($row) {
        $row['total_amount'] = round($row['total_amount'] / 100, 2);
        return $row;
    }, $recentRaw);

    // ── 7-Day Daily Revenue ───────────────────────────────────────────────────
    $stmt = $db->query("
        SELECT DATE(paid_at) AS day, COALESCE(SUM(total_amount), 0) AS revenue
        FROM orders
        WHERE payment_status = 'paid' AND paid_at >= CURDATE() - INTERVAL 6 DAY
        GROUP BY DATE(paid_at)
    ");
    $dailyRows = $stmt->fetchAll();
    $dailyMap  = [];
    foreach ($dailyRows as $row) {
        $dailyMap[$row['day']] = round($row['revenue'] / 100, 2);
    }
    $dailyRevenue = [];
    for ($i = 6; $i >= 0; $i--) {
        $date           = date('Y-m-d', strtotime("-$i days"));
        $dailyRevenue[] = [
            'day'     => $date,
            'label'   => date('D', strtotime($date)),
            'revenue' => $dailyMap[$date] ?? 0,
        ];
    }

    // ── Low Stock Items (≤ 3 units) ───────────────────────────────────────────
    $stmt = $db->query("
        SELECT id, name, stock_quantity, price, featured_image
        FROM products
        WHERE is_active = 1 AND stock_quantity <= 3
        ORDER BY stock_quantity ASC, name ASC
        LIMIT 8
    ");
    $lowStockItems = $stmt->fetchAll();

    jsonResponse([
        'success'          => true,
        'revenue'          => $revenue,
        'orders'           => $orders,
        'products'         => $products,
        'customers'        => $customers,
        'repairs'          => $repairs,
        'recent_orders'    => $recentOrders,
        'daily_revenue'    => $dailyRevenue,
        'low_stock_items'  => $lowStockItems,
    ]);

} catch (PDOException $e) {
    error_log('stats.php error: ' . $e->getMessage());
    jsonResponse(['error' => 'Failed to fetch stats'], 500);
}
