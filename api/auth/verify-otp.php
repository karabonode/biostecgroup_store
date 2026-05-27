<?php
/**
 * Verify Email OTP
 * POST /api/auth/verify-otp.php
 * Body: { "email": "user@example.com", "otp": "123456" }
 */

require_once '../config/database.php';
require_once '../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data  = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? trim((string)$data['email']) : '';
$otp   = isset($data['otp'])   ? trim((string)$data['otp'])   : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email address'], 400);
}

if (!preg_match('/^\d{6}$/', $otp)) {
    jsonResponse(['error' => 'OTP must be a 6-digit code'], 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare("
        SELECT id, email, first_name, last_name, role, email_verified, otp_hash, otp_expires_at
        FROM users
        WHERE email = ? AND is_active = 1
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Account not found'], 404);
    }

    if ($user['email_verified']) {
        jsonResponse(['error' => 'Email is already verified. Please log in.'], 409);
    }

    if (!$user['otp_hash'] || !$user['otp_expires_at']) {
        jsonResponse(['error' => 'No verification code found. Please request a new one.'], 400);
    }

    // Check expiry
    if (strtotime($user['otp_expires_at']) < time()) {
        jsonResponse(['error' => 'Verification code has expired. Please request a new one.', 'expired' => true], 410);
    }

    // Validate OTP
    if (!password_verify($otp, $user['otp_hash'])) {
        jsonResponse(['error' => 'Incorrect verification code. Please try again.'], 400);
    }

    // Mark verified and clear OTP fields
    $stmt = $db->prepare("
        UPDATE users
        SET email_verified = TRUE, otp_hash = NULL, otp_expires_at = NULL, otp_sent_at = NULL
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);

    logActivity($user['id'], 'email_verified', 'users', $user['id']);

    // Issue JWT now that email is confirmed
    $token = generateJWT($user['id'], $user['email'], $user['role']);

    jsonResponse([
        'success' => true,
        'message' => 'Email verified successfully.',
        'token'   => $token,
        'user'    => [
            'id'         => $user['id'],
            'email'      => $user['email'],
            'first_name' => $user['first_name'],
            'last_name'  => $user['last_name'],
            'role'       => $user['role'],
        ],
    ]);

} catch (PDOException $e) {
    error_log('verify-otp error: ' . $e->getMessage());
    jsonResponse(['error' => 'Verification failed. Please try again.'], 500);
}
