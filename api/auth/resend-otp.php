<?php
/**
 * Resend Email OTP
 * POST /api/auth/resend-otp.php
 * Body: { "email": "user@example.com" }
 * Rate-limited: one resend per 60 seconds.
 */

require_once '../config/database.php';
require_once '../config/auth.php';
require_once '../email/order_notifications.php';
require_once '../email/verification.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$data  = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? trim((string)$data['email']) : '';

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(['error' => 'Invalid email address'], 400);
}

try {
    $db = getDB();

    $stmt = $db->prepare("
        SELECT id, first_name, email_verified, otp_sent_at
        FROM users
        WHERE email = ? AND is_active = 1
        LIMIT 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if (!$user) {
        // Return success to avoid email enumeration
        jsonResponse(['success' => true, 'message' => 'If this account exists, a new code has been sent.']);
    }

    if ($user['email_verified']) {
        jsonResponse(['error' => 'This account is already verified. Please log in.'], 409);
    }

    // Rate limit: block resend if last OTP was sent < 60 seconds ago
    if ($user['otp_sent_at']) {
        $secondsSinceLast = time() - strtotime($user['otp_sent_at']);
        if ($secondsSinceLast < 60) {
            $retryAfter = 60 - $secondsSinceLast;
            jsonResponse([
                'error'       => 'Please wait before requesting another code.',
                'retry_after' => $retryAfter,
            ], 429);
        }
    }

    // Generate new OTP
    $otp     = str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $otpHash = password_hash($otp, PASSWORD_BCRYPT, ['cost' => 10]);

    $stmt = $db->prepare("
        UPDATE users
        SET otp_hash = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE), otp_sent_at = NOW()
        WHERE id = ?
    ");
    $stmt->execute([$otpHash, $user['id']]);

    sendVerificationEmail($email, $user['first_name'], $otp);

    jsonResponse(['success' => true, 'message' => 'A new verification code has been sent to your email.']);

} catch (PDOException $e) {
    error_log('resend-otp error: ' . $e->getMessage());
    jsonResponse(['error' => 'Could not resend code. Please try again.'], 500);
}
