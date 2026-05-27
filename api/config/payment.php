<?php
/**
 * Yoco Payment Configuration
 * Loads env vars and provides yocoCharge() helper.
 */

function envValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value !== false && trim((string)$value) !== '') {
        return trim((string)$value);
    }

    if (isset($_ENV[$key]) && trim((string)$_ENV[$key]) !== '') {
        return trim((string)$_ENV[$key]);
    }

    if (isset($_SERVER[$key]) && trim((string)$_SERVER[$key]) !== '') {
        return trim((string)$_SERVER[$key]);
    }

    return $default;
}

function loadEnvFileIfPresent(string $path): void
{
    if (!is_file($path) || !is_readable($path)) {
        return;
    }

    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line) {
        $trimmed = trim($_line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0 || strpos($_line, '=') === false) {
            continue;
        }

        [$_key, $_val] = explode('=', $_line, 2);
        $_key = trim($_key);
        $_val = trim(trim($_val), '"\'');

        if (envValue($_key, '') === '') {
            $_ENV[$_key] = $_val;
            $_SERVER[$_key] = $_val;
            putenv("$_key=$_val");
        }
    }
}

// Load .env from the most likely project roots (covers apache/nginx/php-fpm cwd differences).
$_envCandidates = [
    dirname(__DIR__, 2) . '/.env',
    dirname(__DIR__, 3) . '/.env',
    (isset($_SERVER['DOCUMENT_ROOT']) ? rtrim($_SERVER['DOCUMENT_ROOT'], '/') : '') . '/.env',
    (isset($_SERVER['DOCUMENT_ROOT']) ? dirname(rtrim($_SERVER['DOCUMENT_ROOT'], '/')) : '') . '/.env',
    getcwd() . '/.env',
];

$_envLoaded = false;
foreach ($_envCandidates as $_envPath) {
    if ($_envPath !== '/.env' && is_file($_envPath) && is_readable($_envPath)) {
        loadEnvFileIfPresent($_envPath);
        $_envLoaded = true;
        break; // Load only from the first found .env file
    }
}

$resolvedYocoSecret = envValue('YOCO_SECRET_KEY', envValue('YOCO_SECRET', ''));
$resolvedYocoPublic = envValue('YOCO_PUBLIC_KEY', envValue('VITE_YOCO_PUBLIC_KEY', ''));

define('YOCO_SECRET_KEY',    $resolvedYocoSecret);
define('YOCO_PUBLIC_KEY',    $resolvedYocoPublic);
define('YOCO_CHECKOUT_URL',  'https://payments.yoco.com/api/checkouts');

// Diagnostic constant for debugging
define('_YOCO_ENV_LOADED',   $_envLoaded ? 'yes' : 'no');
define('_YOCO_RESOLVED_KEY', $resolvedYocoSecret ? substr($resolvedYocoSecret, 0, 8) . '***' : 'EMPTY');

/**
 * Create a Yoco hosted-checkout session (redirect-based, no JS SDK required).
 *
 * @return array{success: bool, id: string|null, redirectUrl: string|null, error: string|null}
 */
function yocoCreateCheckout(int $amountCents, string $currency, string $successUrl, string $cancelUrl, array $metadata = []): array
{
    if (YOCO_SECRET_KEY === '') {
        return [
            'success' => false,
            'id' => null,
            'redirectUrl' => null,
            'error' => 'Payment gateway is not configured (YOCO_SECRET_KEY missing).',
        ];
    }

    if ($amountCents < 1000) {
        return [
            'success' => false,
            'id' => null,
            'redirectUrl' => null,
            'error' => 'Minimum card payment amount is R10.00.',
        ];
    }

    $isLiveKey = strpos(YOCO_SECRET_KEY, 'sk_live_') === 0;
    $isInsecureCallback = stripos($successUrl, 'http://') === 0 || stripos($cancelUrl, 'http://') === 0;
    if ($isLiveKey && $isInsecureCallback) {
        return [
            'success' => false,
            'id' => null,
            'redirectUrl' => null,
            'error' => 'Live Yoco keys require HTTPS success/cancel URLs. Use test keys for localhost or switch to HTTPS.',
        ];
    }

    $payload = [
        'amount'     => $amountCents,
        'currency'   => $currency,
        'successUrl' => $successUrl,
        'cancelUrl'  => $cancelUrl,
    ];
    if (!empty($metadata)) {
        $payload['metadata'] = $metadata;
    }

    $ch = curl_init(YOCO_CHECKOUT_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . YOCO_SECRET_KEY,
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_CAINFO         => '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem',
    ]);

    $raw      = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'id' => null, 'redirectUrl' => null, 'error' => 'Network error: ' . $curlErr];
    }

    $response = json_decode($raw, true);

    if ($httpCode === 200 && isset($response['id'], $response['redirectUrl'])) {
        return ['success' => true, 'id' => $response['id'], 'redirectUrl' => $response['redirectUrl'], 'error' => null];
    }

    if (in_array($httpCode, [401, 403], true)) {
        return [
            'success' => false,
            'id' => null,
            'redirectUrl' => null,
            'error' => 'Yoco rejected the request (HTTP ' . $httpCode . '). Check key type and callback URLs.',
        ];
    }

    $errorMsg = $response['message'] ?? $response['error'] ?? (is_string($raw) && trim($raw) !== '' ? trim($raw) : 'Checkout creation failed') . ' (HTTP ' . $httpCode . ')';
    return ['success' => false, 'id' => null, 'redirectUrl' => null, 'error' => $errorMsg];
}

/**
 * Retrieve a Yoco checkout by ID (used to verify payment after redirect).
 *
 * @return array{success: bool, status: string|null, data: array|null, error: string|null}
 */
function yocoGetCheckout(string $checkoutId): array
{
    $ch = curl_init(YOCO_CHECKOUT_URL . '/' . rawurlencode($checkoutId));
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . YOCO_SECRET_KEY,
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_CAINFO         => '/etc/pki/ca-trust/extracted/pem/tls-ca-bundle.pem',
    ]);

    $raw      = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlErr  = curl_error($ch);
    curl_close($ch);

    if ($curlErr) {
        return ['success' => false, 'status' => null, 'data' => null, 'error' => 'Network error: ' . $curlErr];
    }

    $response = json_decode($raw, true);

    if ($httpCode === 200) {
        return ['success' => true, 'status' => $response['status'] ?? 'unknown', 'data' => $response, 'error' => null];
    }

    return ['success' => false, 'status' => null, 'data' => $response, 'error' => $response['message'] ?? 'Checkout not found'];
}
