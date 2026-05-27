<?php
/**
 * Order email notifications — customer confirmation + admin alert.
 * Uses PHPMailer with SMTP. Soft-fails on error (logs but does not throw).
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailException;

$_composerAutoload = dirname(__DIR__) . '/vendor/autoload.php';
if (file_exists($_composerAutoload)) {
    require_once $_composerAutoload;
}

// ── SMTP factory ─────────────────────────────────────────────────────────────

function _buildMailer(): PHPMailer
{
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = getenv('SMTP_HOST') ?: 'mail.biostecgroup.co.za';
    $mail->Port       = (int)(getenv('SMTP_PORT') ?: 465);
    $mail->SMTPAuth   = true;
    $mail->Username   = getenv('SMTP_USER') ?: 'info@biostecgroup.co.za';
    $mail->Password   = getenv('SMTP_PASS') ?: '';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // port 465 = SSL
    $mail->setFrom(
        getenv('SMTP_USER') ?: 'info@biostecgroup.co.za',
        'Biostec Group'
    );
    $mail->isHTML(true);
    $mail->CharSet = 'UTF-8';
    return $mail;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _formatRand(int $cents): string
{
    return 'R ' . number_format($cents / 100, 2);
}

function _itemsTableHtml(array $items): string
{
    $rows = '';
    foreach ($items as $item) {
        $total = _formatRand((int)$item['unit_price'] * (int)$item['quantity']);
        $grade = isset($item['grade']) ? ' (Grade ' . htmlspecialchars($item['grade']) . ')' : '';
        $rows .= '<tr>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;">' . htmlspecialchars($item['product_name']) . $grade . '</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;">' . (int)$item['quantity'] . '</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">' . _formatRand((int)$item['unit_price']) . '</td>
            <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:right;">' . $total . '</td>
        </tr>';
    }
    return '
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
        <thead>
            <tr style="background:#f8fafc;">
                <th style="padding:8px;text-align:left;font-size:12px;color:#64748b;">Item</th>
                <th style="padding:8px;text-align:center;font-size:12px;color:#64748b;">Qty</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#64748b;">Unit Price</th>
                <th style="padding:8px;text-align:right;font-size:12px;color:#64748b;">Total</th>
            </tr>
        </thead>
        <tbody>' . $rows . '</tbody>
    </table>';
}

function _baseTemplate(string $title, string $bodyContent): string
{
    return '<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>' . htmlspecialchars($title) . '</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- header -->
        <tr><td style="background:#1e40af;padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Biostec Group</h1>
          <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Premium Business Technology</p>
        </td></tr>
        <!-- body -->
        <tr><td style="padding:32px;">
          ' . $bodyContent . '
        </td></tr>
        <!-- footer -->
        <tr><td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
            Biostec Group &bull; Johannesburg, South Africa &bull;
            <a href="mailto:info@biostecgroup.co.za" style="color:#3b82f6;">info@biostecgroup.co.za</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>';
}

// ── Public functions ──────────────────────────────────────────────────────────

/**
 * Send order confirmation email to the customer.
 *
 * @param array $order  Row from orders table (must include customer_email, customer_name,
 *                      order_number, total_amount, shipping_cost, payment_reference)
 * @param array $items  Rows from order_items (product_name, unit_price, quantity, grade)
 */
function sendCustomerOrderConfirmation(array $order, array $items): void
{
    try {
        $mail = _buildMailer();
        $mail->addAddress($order['customer_email'], $order['customer_name'] ?? '');
        $mail->Subject = 'Order Confirmed — ' . $order['order_number'];

        $shippingAddr = is_string($order['shipping_address'])
            ? json_decode($order['shipping_address'], true)
            : ($order['shipping_address'] ?? []);

        $isPickup       = ($shippingAddr['fulfilment_method'] ?? '') === 'pickup';
        $deliveryLabel  = $isPickup ? 'In-store Pickup (Johannesburg)' : 'Courier — The Courier Guy';
        $shippingLine   = $isPickup ? 'FREE' : _formatRand((int)$order['shipping_cost']);

        $body = '
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;">Thank you for your order!</h2>
          <p style="color:#475569;margin:0 0 24px;">
            Hi ' . htmlspecialchars($order['customer_name'] ?? 'Customer') . ', your payment was successful
            and your order is now being processed.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:12px 16px;background:#eff6ff;border-radius:8px;">
                <p style="margin:0;font-size:13px;color:#3b82f6;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Order Number</p>
                <p style="margin:4px 0 0;font-size:22px;font-weight:800;color:#1e293b;">' . htmlspecialchars($order['order_number']) . '</p>
              </td>
            </tr>
          </table>

          <h3 style="margin:0 0 4px;color:#1e293b;font-size:14px;">Items Ordered</h3>
          ' . _itemsTableHtml($items) . '

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="padding:4px 0;color:#64748b;font-size:14px;">Shipping</td>
              <td style="padding:4px 0;text-align:right;font-size:14px;">' . $shippingLine . '</td>
            </tr>
            <tr>
              <td style="padding:8px 0 0;color:#1e293b;font-size:16px;font-weight:700;border-top:1px solid #e2e8f0;">Total Paid</td>
              <td style="padding:8px 0 0;text-align:right;font-size:16px;font-weight:700;color:#1e40af;border-top:1px solid #e2e8f0;">' . _formatRand((int)$order['total_amount']) . '</td>
            </tr>
          </table>

          <p style="color:#475569;font-size:14px;"><strong>Delivery:</strong> ' . $deliveryLabel . '</p>

          <p style="color:#475569;font-size:14px;">
            Our team will contact you shortly with ' . ($isPickup ? 'pickup' : 'delivery') . ' details.
            If you have any questions, reply to this email or call <strong>+27612636912</strong>.
          </p>';

        $mail->Body    = _baseTemplate('Order Confirmed — ' . $order['order_number'], $body);
        $mail->AltBody = 'Your order ' . $order['order_number'] . ' has been confirmed. Total: ' . _formatRand((int)$order['total_amount']);
        $mail->send();
    } catch (\Throwable $e) {
        error_log('sendCustomerOrderConfirmation failed: ' . $e->getMessage());
    }
}

/**
 * Send new-order alert to the admin.
 */
function sendAdminOrderNotification(array $order, array $items): void
{
    $adminEmail = getenv('ADMIN_EMAIL') ?: 'info@biostecgroup.co.za';

    try {
        $mail = _buildMailer();
        $mail->addAddress($adminEmail, 'Biostec Admin');
        $mail->Subject = '[NEW ORDER] ' . $order['order_number'] . ' — ' . _formatRand((int)$order['total_amount']);

        $shippingAddr = is_string($order['shipping_address'])
            ? json_decode($order['shipping_address'], true)
            : ($order['shipping_address'] ?? []);

        $isPickup = ($shippingAddr['fulfilment_method'] ?? '') === 'pickup';

        $addressLines = $isPickup
            ? 'In-store Pickup (Johannesburg)'
            : implode(', ', array_filter([
                $shippingAddr['street']      ?? '',
                $shippingAddr['city']        ?? '',
                $shippingAddr['province']    ?? '',
                $shippingAddr['postal_code'] ?? '',
              ]));

        $body = '
          <h2 style="margin:0 0 16px;color:#1e293b;">New Order Received</h2>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="padding:4px 0;color:#64748b;width:140px;font-size:14px;">Order #</td>
                <td style="padding:4px 0;font-weight:700;font-size:14px;">' . htmlspecialchars($order['order_number']) . '</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:14px;">Customer</td>
                <td style="padding:4px 0;font-size:14px;">' . htmlspecialchars($order['customer_name'] ?? '') . '</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:14px;">Email</td>
                <td style="padding:4px 0;font-size:14px;">' . htmlspecialchars($order['customer_email'] ?? '') . '</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:14px;">Phone</td>
                <td style="padding:4px 0;font-size:14px;">' . htmlspecialchars($order['customer_phone'] ?? '') . '</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:14px;">Delivery</td>
                <td style="padding:4px 0;font-size:14px;">' . htmlspecialchars($addressLines) . '</td></tr>
            <tr><td style="padding:4px 0;color:#64748b;font-size:14px;">Payment ref</td>
                <td style="padding:4px 0;font-size:14px;">' . htmlspecialchars($order['payment_reference'] ?? '') . '</td></tr>
          </table>

          <h3 style="margin:0 0 4px;color:#1e293b;font-size:14px;">Items</h3>
          ' . _itemsTableHtml($items) . '

          <p style="font-size:16px;font-weight:700;color:#1e40af;">Total: ' . _formatRand((int)$order['total_amount']) . '</p>';

        $mail->Body    = _baseTemplate('New Order — ' . $order['order_number'], $body);
        $mail->AltBody = 'New order ' . $order['order_number'] . ' from ' . ($order['customer_name'] ?? '') . '. Total: ' . _formatRand((int)$order['total_amount']);
        $mail->send();
    } catch (\Throwable $e) {
        error_log('sendAdminOrderNotification failed: ' . $e->getMessage());
    }
}
