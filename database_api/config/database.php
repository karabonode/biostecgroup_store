<?php

declare(strict_types=1);

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = envValue('DB_HOST', '127.0.0.1');
    $port = envValue('DB_PORT', '3306');
    $name = envValue('DB_NAME', 'biostec_db');
    $user = envValue('DB_USER', 'root');
    $pass = envValue('DB_PASS', '');
    $charset = envValue('DB_CHARSET', 'utf8mb4');

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=%s', $host, $port, $name, $charset);

    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        jsonResponse([
            'error' => 'Database connection failed',
            'details' => $e->getMessage(),
        ], 500);
    }

    return $pdo;
}

function allowedTables(): array
{
    $configured = envValue(
        'API_ALLOWED_TABLES',
        'products,categories,users,orders,order_items,repair_tickets,user_addresses,inventory_logs'
    );

    $tables = array_filter(array_map('trim', explode(',', $configured)), static function ($table) {
        return $table !== '';
    });

    return array_values($tables);
}

function assertAllowedTable(string $table): void
{
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $table)) {
        jsonResponse(['error' => 'Invalid table name'], 400);
    }

    if (!in_array($table, allowedTables(), true)) {
        jsonResponse(['error' => 'Table not allowed'], 403);
    }

    $stmt = db()->prepare('SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?');
    $stmt->execute([$table]);

    if ((int)$stmt->fetchColumn() === 0) {
        jsonResponse(['error' => 'Table does not exist in current database'], 404);
    }
}

function tableColumns(string $table): array
{
    static $cache = [];

    if (isset($cache[$table])) {
        return $cache[$table];
    }

    $stmt = db()->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $table) . '`');
    $stmt->execute();
    $rows = $stmt->fetchAll();

    $columns = [];
    foreach ($rows as $row) {
        $columns[] = [
            'name' => (string)$row['Field'],
            'isAutoIncrement' => strpos((string)$row['Extra'], 'auto_increment') !== false,
        ];
    }

    $cache[$table] = $columns;
    return $columns;
}

function writeableColumns(string $table): array
{
    $result = [];

    foreach (tableColumns($table) as $column) {
        if ($column['isAutoIncrement']) {
            continue;
        }

        $name = $column['name'];
        if ($name === 'created_at' || $name === 'updated_at') {
            continue;
        }

        $result[] = $name;
    }

    return $result;
}
