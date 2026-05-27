<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/config/bootstrap.php';
loadDefaultEnvChain(dirname(__DIR__));
require_once dirname(__DIR__) . '/config/database.php';

requireApiKeyForRequest();
enforceReadOnlyMode();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');

if ($scriptDir !== '' && $scriptDir !== '/' && strpos($path, $scriptDir) === 0) {
    $path = substr($path, strlen($scriptDir));
}

$path = '/' . trim($path, '/');
if ($path === '//') {
    $path = '/';
}

if ($path === '/health') {
    jsonResponse([
        'status' => 'ok',
        'service' => 'database_api',
        'db_host' => envValue('DB_HOST', '127.0.0.1'),
        'db_port' => envValue('DB_PORT', '3306'),
        'database' => envValue('DB_NAME', 'biostec_db'),
        'read_only' => isReadOnlyMode(),
        'time' => gmdate('c'),
    ]);
}

if ($path === '/' || $path === '/tables') {
    jsonResponse([
        'allowed_tables' => allowedTables(),
        'routes' => [
            'GET /health',
            'GET /tables',
            'GET /{table}',
            'GET /{table}/{id}',
            'POST /{table}',
            'PUT /{table}/{id}',
            'PATCH /{table}/{id}',
            'DELETE /{table}/{id}',
        ],
    ]);
}

$parts = array_values(array_filter(explode('/', trim($path, '/'))));
$table = $parts[0] ?? '';
$id = $parts[1] ?? null;

if ($table === '') {
    jsonResponse(['error' => 'Not found'], 404);
}

assertAllowedTable($table);

if ($method === 'GET' && $id === null) {
    listRows($table);
}

if ($method === 'GET' && $id !== null) {
    getRow($table, $id);
}

if ($method === 'POST' && $id === null) {
    createRow($table);
}

if (($method === 'PUT' || $method === 'PATCH') && $id !== null) {
    updateRow($table, $id);
}

if ($method === 'DELETE' && $id !== null) {
    deleteRow($table, $id);
}

jsonResponse(['error' => 'Route not found'], 404);

function listRows(string $table): void
{
    $defaultLimit = (int)envValue('API_DEFAULT_LIMIT', '50');
    $maxLimit = (int)envValue('API_MAX_LIMIT', '200');

    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = (int)($_GET['limit'] ?? $defaultLimit);
    $limit = max(1, min($limit, $maxLimit));
    $offset = ($page - 1) * $limit;

    $sort = $_GET['sort'] ?? 'id';
    $order = strtoupper((string)($_GET['order'] ?? 'DESC'));
    if ($order !== 'ASC') {
        $order = 'DESC';
    }

    $validColumns = array_map(static function ($col) {
        return $col['name'];
    }, tableColumns($table));

    if (!in_array($sort, $validColumns, true)) {
        $sort = in_array('id', $validColumns, true) ? 'id' : $validColumns[0];
    }

    $params = [];
    $whereSql = '';

    $searchTerm = trim((string)($_GET['q'] ?? ''));
    $searchColsRaw = trim((string)($_GET['search'] ?? ''));

    if ($searchTerm !== '' && $searchColsRaw !== '') {
        $requestedCols = array_filter(array_map('trim', explode(',', $searchColsRaw)), static function ($c) {
            return $c !== '';
        });

        $searchCols = [];
        foreach ($requestedCols as $col) {
            if (in_array($col, $validColumns, true)) {
                $searchCols[] = $col;
            }
        }

        if (!empty($searchCols)) {
            $chunks = [];
            foreach ($searchCols as $col) {
                $chunks[] = '`' . str_replace('`', '``', $col) . '` LIKE ?';
                $params[] = '%' . $searchTerm . '%';
            }
            $whereSql = ' WHERE ' . implode(' OR ', $chunks);
        }
    }

    $safeTable = '`' . str_replace('`', '``', $table) . '`';
    $safeSort = '`' . str_replace('`', '``', $sort) . '`';

    $countSql = 'SELECT COUNT(*) FROM ' . $safeTable . $whereSql;
    $countStmt = db()->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $querySql = 'SELECT * FROM ' . $safeTable . $whereSql . ' ORDER BY ' . $safeSort . ' ' . $order . ' LIMIT ? OFFSET ?';
    $stmt = db()->prepare($querySql);

    $idx = 1;
    foreach ($params as $param) {
        $stmt->bindValue($idx, $param, PDO::PARAM_STR);
        $idx++;
    }
    $stmt->bindValue($idx++, $limit, PDO::PARAM_INT);
    $stmt->bindValue($idx, $offset, PDO::PARAM_INT);

    $stmt->execute();
    $rows = $stmt->fetchAll();

    jsonResponse([
        'table' => $table,
        'page' => $page,
        'limit' => $limit,
        'total' => $total,
        'rows' => $rows,
    ]);
}

function getRow(string $table, string $id): void
{
    $stmt = db()->prepare('SELECT * FROM `' . str_replace('`', '``', $table) . '` WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();

    if (!$row) {
        jsonResponse(['error' => 'Row not found'], 404);
    }

    jsonResponse([
        'table' => $table,
        'row' => $row,
    ]);
}

function createRow(string $table): void
{
    $payload = readJsonBody();
    if (empty($payload)) {
        jsonResponse(['error' => 'Request body is required'], 400);
    }

    $allowed = writeableColumns($table);
    $fields = [];
    $values = [];

    foreach ($payload as $key => $value) {
        if (!is_string($key) || !in_array($key, $allowed, true)) {
            continue;
        }

        $fields[] = $key;
        $values[] = $value;
    }

    if (empty($fields)) {
        jsonResponse(['error' => 'No valid fields in payload'], 400);
    }

    $safeFields = array_map(static function ($f) {
        return '`' . str_replace('`', '``', $f) . '`';
    }, $fields);

    $placeholders = implode(',', array_fill(0, count($fields), '?'));
    $sql = 'INSERT INTO `' . str_replace('`', '``', $table) . '` (' . implode(',', $safeFields) . ') VALUES (' . $placeholders . ')';

    $stmt = db()->prepare($sql);
    $stmt->execute($values);

    $id = (int)db()->lastInsertId();

    jsonResponse([
        'message' => 'Row created',
        'table' => $table,
        'id' => $id,
    ], 201);
}

function updateRow(string $table, string $id): void
{
    $payload = readJsonBody();
    if (empty($payload)) {
        jsonResponse(['error' => 'Request body is required'], 400);
    }

    $allowed = writeableColumns($table);
    $setSql = [];
    $values = [];

    foreach ($payload as $key => $value) {
        if (!is_string($key) || !in_array($key, $allowed, true)) {
            continue;
        }

        $setSql[] = '`' . str_replace('`', '``', $key) . '` = ?';
        $values[] = $value;
    }

    if (empty($setSql)) {
        jsonResponse(['error' => 'No valid fields in payload'], 400);
    }

    $values[] = $id;
    $sql = 'UPDATE `' . str_replace('`', '``', $table) . '` SET ' . implode(', ', $setSql) . ' WHERE id = ?';

    $stmt = db()->prepare($sql);
    $stmt->execute($values);

    jsonResponse([
        'message' => 'Row updated',
        'table' => $table,
        'id' => $id,
        'affected_rows' => $stmt->rowCount(),
    ]);
}

function deleteRow(string $table, string $id): void
{
    $stmt = db()->prepare('DELETE FROM `' . str_replace('`', '``', $table) . '` WHERE id = ?');
    $stmt->execute([$id]);

    jsonResponse([
        'message' => 'Row deleted',
        'table' => $table,
        'id' => $id,
        'affected_rows' => $stmt->rowCount(),
    ]);
}
