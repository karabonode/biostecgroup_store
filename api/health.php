<?php
/**
 * Comprehensive system health check
 */

require_once '/var/www/biostecgroup-1/api/config/database.php';
require_once '/var/www/biostecgroup-1/api/config/payment.php';

$health = [
    'timestamp' => date('Y-m-d H:i:s'),
    'yoco' => [
        'secret_key_loaded' => (bool)YOCO_SECRET_KEY,
        'secret_key_length' => strlen(YOCO_SECRET_KEY),
        'secret_key_starts_with' => substr(YOCO_SECRET_KEY, 0, 8),
        'is_live_key' => strpos(YOCO_SECRET_KEY, 'sk_live_') === 0,
    ],
    'env_loading' => [
        'env_loaded' => defined('_YOCO_ENV_LOADED') ? _YOCO_ENV_LOADED : 'unknown',
    ],
    'test_checkout' => null,
];

// Test creating a checkout with HTTPS URLs (required for live keys)
if (YOCO_SECRET_KEY) {
    $checkout = yocoCreateCheckout(
        5000,
        'ZAR',
        'https://www.biostecgroup.co.za/checkout/success',
        'https://www.biostecgroup.co.za/checkout'
    );
    
    $health['test_checkout'] = [
        'attempted' => true,
        'success' => $checkout['success'] ?? false,
        'has_redirect_url' => !empty($checkout['redirectUrl']),
        'error' => $checkout['error'] ?? 'N/A',
    ];
}

header('Content-Type: application/json');
echo json_encode($health, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
