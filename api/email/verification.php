<?php
/**
 * Email verification OTP — sends a 6-digit code to the registering user.
 * Requires order_notifications.php to be included first (provides _buildMailer
 * and _baseTemplate). Soft-fails: logs on error, never throws.
 */

function sendVerificationEmail(string $toEmail, string $firstName, string $otp): void
{
    try {
        $mail = _buildMailer();
        $mail->addAddress($toEmail, $firstName);
        $mail->Subject = 'Your Biostec verification code: ' . $otp;

        $body = '
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Verify your email address</h2>
          <p style="color:#475569;margin:0 0 24px;font-size:15px;">
            Hi ' . htmlspecialchars($firstName) . ', thanks for registering with Biostec Group.
            Enter the code below to confirm your email and activate your account.
          </p>

          <div style="text-align:center;margin:32px 0;">
            <div style="display:inline-block;background:#eff6ff;border:2px solid #bfdbfe;
                        border-radius:12px;padding:20px 40px;">
              <p style="margin:0 0 4px;font-size:12px;color:#3b82f6;font-weight:700;
                         text-transform:uppercase;letter-spacing:.1em;">Verification Code</p>
              <p style="margin:0;font-size:44px;font-weight:900;color:#1e40af;
                         letter-spacing:12px;font-family:monospace;">' . htmlspecialchars($otp) . '</p>
            </div>
          </div>

          <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0 0 24px;">
            This code expires in <strong>10 minutes</strong>.
          </p>

          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">

          <p style="color:#94a3b8;font-size:12px;">
            If you did not create a Biostec Group account, you can safely ignore this email.
            Do not share this code with anyone.
          </p>';

        $mail->Body    = _baseTemplate('Verify your Biostec account', $body);
        $mail->AltBody = 'Your Biostec verification code is: ' . $otp . '. It expires in 10 minutes.';
        $mail->send();
    } catch (\Throwable $e) {
        error_log('sendVerificationEmail failed for ' . $toEmail . ': ' . $e->getMessage());
    }
}
