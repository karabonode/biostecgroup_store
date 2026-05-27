<?php
/**
 * Email configuration for order notifications.
 *
 * Set EMAIL_ENABLED=true and update SMTP values for production.
 */

define('EMAIL_ENABLED', false);
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('SMTP_ENCRYPTION', 'tls');
define('EMAIL_FROM_ADDRESS', 'noreply@biostecgroup.co.za');
define('EMAIL_FROM_NAME', 'Biostec Group');
define('EMAIL_REPLY_TO', 'info@biostecgroup.co.za');

define('ADMIN_NOTIFICATION_EMAILS', [
    'info@biostecgroup.co.za',
    'lethabo@biostecgroup.co.za',
    'mahlatse@biostecgroup.co.za',
]);
