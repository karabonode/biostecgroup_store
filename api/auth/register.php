<?php
/**
 * User Registration API
 * POST /api/auth/register.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../email/order_notifications.php';
require_once '../email/verification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Get input
$data = json_decode(file_get_contents('php://input'), true);

$email = isset($data['email']) ? sanitize($data['email']) : '';
$password = isset($data['password']) ? $data['password'] : '';
$firstName = isset($data['first_name']) ? sanitize($data['first_name']) : '';
$lastName = isset($data['last_name']) ? sanitize($data['last_name']) : '';
$phone = isset($data['phone']) ? sanitize($data['phone']) : '';

// Validation
$errors = [];

if (empty($email)) {
    $errors[] = 'Email is required';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Invalid email format';
}

if (empty($password)) {
    $errors[] = 'Password is required';
} elseif (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters';
}

if (empty($firstName)) {
    $errors[] = 'First name is required';
}

if (empty($lastName)) {
    $errors[] = 'Last name is required';
}

if (!empty($errors)) {
    jsonResponse(['error' => 'Validation failed', 'errors' => $errors], 400);
}

try {
    $db = getDB();
    
    // Check if email exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Email already registered'], 409);
    }
    
    // Hash password
    $passwordHash = hashPassword($password);
    
    // Insert user
    $stmt = $db->prepare("
        INSERT INTO users (email, password_hash, first_name, last_name, phone, role)
        VALUES (?, ?, ?, ?, ?, 'customer')
    ");
    $stmt->execute([$email, $passwordHash, $firstName, $lastName, $phone]);
    
    $userId = $db->lastInsertId();

    // Generate 6-digit OTP, store hash + expiry
    $otp     = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpHash = password_hash($otp, PASSWORD_BCRYPT, ['cost' => 10]);

    $stmt = $db->prepare("
        UPDATE users
        SET otp_hash = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE), otp_sent_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$otpHash, $userId]);

    // Send verification email (soft-fails on SMTP error — logs and continues)
    sendVerificationEmail($email, $firstName, $otp);

    // Log activity
    logActivity($userId, 'user_registered', 'users', $userId);

    // Return pending-verification state — no JWT until email is confirmed
    jsonResponse([
        'success'                => true,
        'requires_verification'  => true,
        'message'                => 'Registration successful. Check your email for a 6-digit verification code.',
        'email'                  => $email,
    ], 201);
    
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    jsonResponse(['error' => 'An error occurred during registration'], 500);
}
