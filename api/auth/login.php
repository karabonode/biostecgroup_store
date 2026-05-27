<?php
/**
 * User Login API
 * POST /api/auth/login.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Get input
$data = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? sanitize($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';

// Validation
if (empty($email) || empty($password)) {
    jsonResponse(['error' => 'Email and password are required'], 400);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email format'], 400);
}

try {
    $db = getDB();
    
    // Find user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = ? AND is_active = 1 LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }
    
    // Verify password
    if (!verifyPassword($password, $user['password_hash'])) {
        jsonResponse(['error' => 'Invalid email or password'], 401);
    }

    // Block unverified accounts
    if (!$user['email_verified']) {
        jsonResponse([
            'error'                  => 'Please verify your email address. Check your inbox for a 6-digit code.',
            'requires_verification'  => true,
            'email'                  => $user['email'],
        ], 403);
    }

    // Update last login
    $stmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Generate token
    $token = generateJWT($user['id'], $user['email'], $user['role']);
    
    // Return user data (without password)
    jsonResponse([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'role' => $user['role'],
            'avatar_url' => $user['avatar_url']
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    jsonResponse(['error' => 'An error occurred during login'], 500);
}
