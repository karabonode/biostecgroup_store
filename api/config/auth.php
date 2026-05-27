<?php
/**
 * Authentication Helper Functions
 */

require_once 'database.php';

// JWT secret loaded from environment — never hardcode this value
$_jwtSecret = getenv('JWT_SECRET');
if (!$_jwtSecret || strlen($_jwtSecret) < 32) {
    error_log('FATAL: JWT_SECRET env var is missing or too short (min 32 chars required)');
    http_response_code(500);
    exit(json_encode(['error' => 'Server configuration error']));
}
define('JWT_SECRET', $_jwtSecret);
unset($_jwtSecret);
define('JWT_EXPIRY', 14400); // 4 hours

/**
 * Hash password using bcrypt
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generate JWT Token
 */
function generateJWT($userId, $email, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $time = time();
    $payload = json_encode([
        'iss' => 'biostec-api',
        'iat' => $time,
        'exp' => $time + JWT_EXPIRY,
        'sub' => $userId,
        'email' => $email,
        'role' => $role
    ]);
    
    $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    
    $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    return $base64Header . "." . $base64Payload . "." . $base64Signature;
}

/**
 * Validate JWT Token
 */
function validateJWT($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
    
    if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
        return false;
    }
    
    $signature = hash_hmac('sha256', $parts[0] . "." . $parts[1], JWT_SECRET, true);
    $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    
    if (!hash_equals($base64Signature, $parts[2])) {
        return false;
    }
    
    return $payload;
}

/**
 * Get current user from token
 */
function getCurrentUser() {
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $payload = validateJWT($token);
    
    if (!$payload) {
        return null;
    }
    
    return [
        'id' => $payload['sub'],
        'email' => $payload['email'],
        'role' => $payload['role']
    ];
}

/**
 * Require authentication
 */
function requireAuth() {
    $user = getCurrentUser();
    if (!$user) {
        jsonResponse(['error' => 'Unauthorized'], 401);
    }
    return $user;
}

/**
 * Require admin role
 */
function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonResponse(['error' => 'Forbidden - Admin access required'], 403);
    }
    return $user;
}

/**
 * Sanitize input for HTML output only.
 * NOT a substitute for parameterized queries — always use prepared statements for SQL.
 */
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Generate unique order/ticket number
 */
function generateNumber($prefix) {
    return $prefix . date('Ymd') . strtoupper(substr(uniqid(), -6));
}

/**
 * Log admin activity
 */
function logActivity($userId, $action, $entityType, $entityId = null, $oldValues = null, $newValues = null) {
    $db = getDB();
    $stmt = $db->prepare("
        INSERT INTO admin_activity_logs 
        (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $userId,
        $action,
        $entityType,
        $entityId,
        $oldValues ? json_encode($oldValues) : null,
        $newValues ? json_encode($newValues) : null,
        $_SERVER['REMOTE_ADDR'] ?? null,
        $_SERVER['HTTP_USER_AGENT'] ?? null
    ]);
}
