<?php

declare(strict_types=1);

function loadEnv(string $envFile, bool $overrideExisting = false): void
{
    if (!file_exists($envFile)) {
        return;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0 || strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");

        if ($overrideExisting || !array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}

function loadDefaultEnvChain(string $apiRoot): void
{
    $sharedAppEnv = dirname($apiRoot) . '/.env';
    $apiLocalEnv = $apiRoot . '/.env';

    // Prefer shared Biostecgroup env so this API can point at the same DB.
    loadEnv($sharedAppEnv, false);

    // Allow database_api/.env to provide values only when missing.
    loadEnv($apiLocalEnv, false);
}

function envValue(string $key, string $default = ''): string
{
    $value = getenv($key);
    if ($value === false || $value === null || $value === '') {
        return $default;
    }

    return (string)$value;
}

function allowedOrigins(): array
{
    $configured = envValue('API_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000');
    $parts = array_filter(array_map('trim', explode(',', $configured)), static function ($item) {
        return $item !== '';
    });

    return array_values($parts);
}

function getRequestOrigin(): string
{
    return $_SERVER['HTTP_ORIGIN'] ?? '';
}

function applyCorsHeaders(): void
{
    $origin = getRequestOrigin();
    $allowed = allowedOrigins();

    if ($origin !== '' && in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }

    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key');
}

function jsonResponse($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    applyCorsHeaders();
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        jsonResponse(['error' => 'Invalid JSON body'], 400);
    }

    return $decoded;
}

function requireApiKeyForRequest(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'OPTIONS') {
        http_response_code(204);
        applyCorsHeaders();
        exit;
    }

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if ($path === '/health' || substr($path, -7) === '/health') {
        return;
    }

    $required = envValue('API_KEY', '');
    if ($required === '') {
        jsonResponse(['error' => 'API_KEY is not configured'], 500);
    }

    $provided = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if ($provided === '' || !hash_equals($required, $provided)) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
}

function isReadOnlyMode(): bool
{
    return envValue('API_READ_ONLY', '1') === '1';
}

function enforceReadOnlyMode(): void
{
    if (!isReadOnlyMode()) {
        return;
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET' || $method === 'HEAD' || $method === 'OPTIONS') {
        return;
    }

    jsonResponse([
        'error' => 'Read-only mode is enabled',
        'method' => $method,
    ], 403);
}
