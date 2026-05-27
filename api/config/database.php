<?php
/**
 * Database Configuration
 * XAMPP Local Development Settings
 */

// Load .env from project root (two levels up from api/config/)
$_envPath = dirname(__DIR__, 2) . '/.env';
if (file_exists($_envPath)) {
    foreach (file($_envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line) {
        $trimmed = trim($_line);
        if ($trimmed === '' || strpos($trimmed, '#') === 0 || strpos($_line, '=') === false) {
            continue;
        }
        [$_key, $_val] = explode('=', $_line, 2);
        $_key = trim($_key);
        $_val = trim(trim($_val), '"\'');
        if (!array_key_exists($_key, $_ENV)) {
            $_ENV[$_key] = $_val;
            putenv("$_key=$_val");
        }
    }
}

// Database credentials
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'biostec_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : (getenv('DB_PASS') ?: ''));
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');
define('DB_PERSISTENT', (getenv('DB_PERSISTENT') ?: '0') === '1');
define('DB_AUTO_CREATE', (getenv('DB_AUTO_CREATE') ?: '0') === '1');
define('DB_CONNECT_RETRIES', max(1, (int)(getenv('DB_CONNECT_RETRIES') ?: 3)));
define('DB_CONNECT_RETRY_DELAY_MS', max(100, (int)(getenv('DB_CONNECT_RETRY_DELAY_MS') ?: 400)));

function createDatabaseIfMissing(): void {
    if (!DB_AUTO_CREATE) {
        return;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec('CREATE DATABASE IF NOT EXISTS `' . str_replace('`', '``', DB_NAME) . '` CHARACTER SET ' . DB_CHARSET . ' COLLATE utf8mb4_unicode_ci');
}

function createPdoConnection(): PDO {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => DB_PERSISTENT,
    ];
    return new PDO($dsn, DB_USER, DB_PASS, $options);
}

// Create database connection
function getDB() {
    static $pdo = null;

    // Long-running workers can hold stale persistent handles; probe before reuse.
    if ($pdo !== null) {
        try {
            $pdo->query('SELECT 1');
            return $pdo;
        } catch (PDOException $e) {
            $pdo = null;
        }
    }

    $lastError = null;
    for ($attempt = 1; $attempt <= DB_CONNECT_RETRIES; $attempt++) {
        try {
            createDatabaseIfMissing();
            $pdo = createPdoConnection();
            return $pdo;
        } catch (PDOException $e) {
            $lastError = $e;

            // If DB was dropped and auto-create is enabled, retry once after create.
            if (DB_AUTO_CREATE && stripos($e->getMessage(), 'Unknown database') !== false) {
                try {
                    createDatabaseIfMissing();
                } catch (PDOException $inner) {
                    $lastError = $inner;
                }
            }

            if ($attempt < DB_CONNECT_RETRIES) {
                usleep(DB_CONNECT_RETRY_DELAY_MS * 1000);
            }
        }
    }

    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database connection failed. Please confirm MySQL is running and credentials are correct.',
        'details' => $lastError ? $lastError->getMessage() : 'Unknown database error'
    ]);
    exit;
}

function hasTableColumn(PDO $db, string $table, string $column): bool {
    static $cache = [];

    $cacheKey = $table . '.' . $column;
    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }

    $stmt = $db->prepare('
        SELECT COUNT(*)
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
    ');
    $stmt->execute([$table, $column]);

    $cache[$cacheKey] = ((int)$stmt->fetchColumn()) > 0;
    return $cache[$cacheKey];
}

function hasTable(PDO $db, string $table): bool {
    static $cache = [];

    if (array_key_exists($table, $cache)) {
        return $cache[$table];
    }

    $stmt = $db->prepare('SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
    $stmt->execute([$table]);
    $cache[$table] = ((int)$stmt->fetchColumn()) > 0;
    return $cache[$table];
}

// Helper function to send JSON response
function getAllowedOrigin(): string {
    $allowed = [
        'https://www.biostecgroup.co.za',
        'https://biostecgroup.co.za',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
    ];
    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    return in_array($origin, $allowed, true) ? $origin : $allowed[0];
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: ' . getAllowedOrigin());
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Vary: Origin');
    echo json_encode($data);
    exit;
}

// Handle preflight requests
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    header('Access-Control-Allow-Origin: ' . getAllowedOrigin());
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Vary: Origin');
    exit;
}
