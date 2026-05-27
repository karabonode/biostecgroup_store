<?php
/**
 * Banner Slides API
 * GET  /api/banners/index.php  — public, returns current slides
 * POST /api/banners/index.php  — admin only, saves slides
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$DEFAULT_SLIDES = [
    ['desktop' => '/banners/1.png',   'phone' => '/banners/phone-1.png',   'alt' => 'New Product – Coming Soon'],
    ['desktop' => '/banners/2.png',   'phone' => '/banners/phone-2.png',   'alt' => 'Laptop Sale – 30% Off'],
    ['desktop' => '/banners/3.png',   'phone' => '/banners/phone-3.png',   'alt' => 'Refer a Friend – 10% Cash Back'],
    ['desktop' => '/banners/4.png',   'phone' => '/banners/phone-4.png',   'alt' => 'Repair Your Laptop – Book Today'],
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $db  = getDB();
    $stmt = $db->prepare("SELECT setting_value FROM settings WHERE setting_key = 'homepage_banners' LIMIT 1");
    $stmt->execute();
    $row = $stmt->fetch();

    $slides = $row ? json_decode($row['setting_value'], true) : null;
    if (!is_array($slides) || count($slides) === 0) {
        $slides = $GLOBALS['DEFAULT_SLIDES'];
    }

    jsonResponse(['success' => true, 'slides' => $slides]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = requireAdmin();

    $body = json_decode(file_get_contents('php://input'), true);
    if (!isset($body['slides']) || !is_array($body['slides'])) {
        jsonResponse(['error' => 'slides array is required'], 400);
    }

    $slides = [];
    foreach ($body['slides'] as $slide) {
        if (empty($slide['desktop']) || empty($slide['phone'])) {
            jsonResponse(['error' => 'Each slide needs desktop and phone image URLs'], 400);
        }
        $slides[] = [
            'desktop' => trim($slide['desktop']),
            'phone'   => trim($slide['phone']),
            'alt'     => trim($slide['alt'] ?? ''),
        ];
    }

    if (count($slides) === 0) {
        jsonResponse(['error' => 'At least one slide is required'], 400);
    }

    $db  = getDB();
    $json = json_encode($slides);

    $stmt = $db->prepare("SELECT id FROM settings WHERE setting_key = 'homepage_banners' LIMIT 1");
    $stmt->execute();
    $exists = $stmt->fetch();

    if ($exists) {
        $db->prepare("UPDATE settings SET setting_value = ?, setting_type = 'json', updated_at = NOW() WHERE setting_key = 'homepage_banners'")
           ->execute([$json]);
    } else {
        $db->prepare("INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES ('homepage_banners', ?, 'json', 'Homepage hero banner slides')")
           ->execute([$json]);
    }

    jsonResponse(['success' => true, 'slides' => $slides]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
