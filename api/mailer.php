<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailException;

require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';

/**
 * Load SMTP config: DB rows take priority over oasis-config.php constants.
 * Requires $pdo to be in scope (set by config.php).
 */
function smtp_config(): array {
    global $pdo;
    $cfg = [
        'host'     => defined('SMTP_HOST') ? SMTP_HOST : 'smtp.hostinger.com',
        'port'     => defined('SMTP_PORT') ? (int) SMTP_PORT : 587,
        'user'     => defined('SMTP_USER') ? SMTP_USER : '',
        'pass'     => defined('SMTP_PASS') ? SMTP_PASS : '',
        'from'     => defined('SMTP_FROM') ? SMTP_FROM : '',
        'from_name'=> 'Oasis Orchard Technologies',
        'secure'   => 'tls', // tls = STARTTLS (587), ssl = implicit (465)
        'enabled'  => false,
    ];

    if (!isset($pdo)) return $cfg;

    try {
        $rows = $pdo->query("SELECT `key`, `value` FROM smtp_settings")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            switch ($r['key']) {
                case 'smtp_host':      $cfg['host']      = $r['value']; break;
                case 'smtp_port':      $cfg['port']      = (int) $r['value']; break;
                case 'smtp_user':      $cfg['user']      = $r['value']; break;
                case 'smtp_pass':      $cfg['pass']      = $r['value']; break;
                case 'smtp_from':      $cfg['from']      = $r['value']; break;
                case 'smtp_from_name': $cfg['from_name'] = $r['value']; break;
                case 'smtp_secure':    $cfg['secure']    = $r['value']; break;
                case 'smtp_enabled':   $cfg['enabled']   = ($r['value'] === 'true' || $r['value'] === '1'); break;
            }
        }
    } catch (Throwable $e) {
        // smtp_settings table may not exist yet — fall back to constants
    }

    if (!$cfg['from'] && $cfg['user']) $cfg['from'] = $cfg['user'];
    return $cfg;
}

// Last error from sendMail() — readable by test endpoint
$GLOBALS['_mailer_last_error'] = '';

function sendMail(string $toEmail, string $toName, string $subject, string $html, string $plain = ''): bool {
    $cfg = smtp_config();

    if (!$cfg['enabled']) {
        $GLOBALS['_mailer_last_error'] = 'SMTP is disabled. Enable it in Admin → Notifications → SMTP.';
        error_log("[Mailer] SMTP disabled");
        return false;
    }
    if (!$cfg['user'] || !$cfg['pass']) {
        $GLOBALS['_mailer_last_error'] = 'SMTP username or password is empty. Check Admin → Notifications → SMTP.';
        error_log("[Mailer] SMTP credentials not configured");
        return false;
    }

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $cfg['host'];
        $mail->Port       = $cfg['port'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $cfg['user'];
        $mail->Password   = $cfg['pass'];
        $mail->SMTPSecure = $cfg['secure'] === 'ssl'
            ? PHPMailer::ENCRYPTION_SMTPS
            : PHPMailer::ENCRYPTION_STARTTLS;

        $mail->setFrom($cfg['from'], $cfg['from_name']);
        $mail->addAddress($toEmail, $toName);
        $mail->isHTML(true);
        $mail->CharSet  = 'UTF-8';
        $mail->Subject  = $subject;
        $mail->Body     = $html;
        $mail->AltBody  = $plain ?: strip_tags(preg_replace('#<br\s*/?>|</p>|</div>|</tr>#i', "\n", $html));

        $mail->send();
        $GLOBALS['_mailer_last_error'] = '';
        return true;
    } catch (MailException $e) {
        $GLOBALS['_mailer_last_error'] = $mail->ErrorInfo;
        error_log("[Mailer] PHPMailer error: " . $mail->ErrorInfo);
        return false;
    }
}

// ── Admin email helper ────────────────────────────────────────────

function admin_notify_email(): string {
    global $pdo;
    try {
        $s = $pdo->prepare("SELECT `value` FROM notification_settings WHERE `key`='admin_email'");
        $s->execute();
        return (string)($s->fetchColumn() ?: '');
    } catch (Throwable $e) { return ''; }
}

function notify_admin(string $subject, string $html): void {
    $to = admin_notify_email();
    if ($to) sendMail($to, 'Admin', $subject, $html);
}

// ── Email templates ───────────────────────────────────────────────

function emailWrap(string $title, string $bodyHtml, string $previewText = ''): string {
    $year    = date('Y');
    $preview = $previewText ? "<div style='display:none;max-height:0;overflow:hidden;'>$previewText &nbsp;&zwnj;&nbsp;&zwnj;</div>" : '';
    return "<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<title>$title</title>$preview</head>
<body style='margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:32px 16px;'>
<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>
  <tr><td style='background:linear-gradient(135deg,#0a1628,#1bb0ce);padding:24px 32px;border-radius:12px 12px 0 0;'>
    <h1 style='margin:0;color:#fff;font-size:20px;font-weight:700;'>Oasis Orchard Technologies</h1>
    <p style='margin:4px 0 0;color:#b3e8f5;font-size:13px;'>Professional Wireless Solutions &mdash; Canada</p>
  </td></tr>
  <tr><td style='background:#fff;padding:32px;border:1px solid #e8ecf0;border-top:none;'>
    $bodyHtml
  </td></tr>
  <tr><td style='background:#f8fafc;padding:16px 32px;border:1px solid #e8ecf0;border-top:none;border-radius:0 0 12px 12px;text-align:center;'>
    <p style='margin:0;color:#aaa;font-size:12px;'>&copy; $year Oasis Orchard Technologies<br>
    <a href='https://oasisorchardtech.com' style='color:#1bb0ce;text-decoration:none;'>oasisorchardtech.com</a></p>
  </td></tr>
</table></td></tr></table></body></html>";
}

function emailVerificationHtml(string $name, string $verifyUrl): string {
    $n = htmlspecialchars($name);
    $u = htmlspecialchars($verifyUrl);
    return emailWrap('Verify Your Email', "
    <h2 style='margin:0 0 8px;color:#0a1628;font-size:22px;'>Welcome, $n!</h2>
    <p style='color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;'>
      Thanks for signing up. Click the button below to verify your email address and activate your account.
    </p>
    <div style='text-align:center;margin:32px 0;'>
      <a href='$u' style='display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;
         text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;'>
        Verify Email Address
      </a>
    </div>
    <p style='color:#888;font-size:13px;'>This link expires in 24 hours. If you did not create an account, ignore this email.</p>
    <p style='color:#aaa;font-size:12px;margin-top:16px;word-break:break-all;'>
      Or copy this link into your browser:<br><span style='color:#1bb0ce;'>$u</span>
    </p>", 'Verify your Oasis Orchard Technologies account');
}

function passwordResetHtml(string $name, string $resetUrl): string {
    $n = htmlspecialchars($name);
    $u = htmlspecialchars($resetUrl);
    return emailWrap('Reset Your Password', "
    <h2 style='margin:0 0 8px;color:#0a1628;font-size:22px;'>Password Reset Request</h2>
    <p style='color:#555;font-size:15px;line-height:1.6;margin:0 0 8px;'>Hi $n,</p>
    <p style='color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;'>
      We received a request to reset the password for your account. Click the button below to choose a new password.
    </p>
    <div style='text-align:center;margin:32px 0;'>
      <a href='$u' style='display:inline-block;background:#0a1628;color:#fff;
         text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;'>
        Reset Password
      </a>
    </div>
    <p style='color:#888;font-size:13px;'>This link expires in <strong>1 hour</strong>.
      If you did not request a password reset, no action is needed &mdash; your password remains unchanged.</p>
    <p style='color:#aaa;font-size:12px;margin-top:16px;word-break:break-all;'>
      Or copy this link:<br><span style='color:#1bb0ce;'>$u</span>
    </p>", 'Reset your Oasis Orchard Technologies password');
}

function orderConfirmationHtml(array $order, array $items): string {
    $rows = '';
    foreach ($items as $it) {
        $rows .= "<tr>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;color:#0a1628;'>" . htmlspecialchars($it['product_name']) . "</td>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#555;'>" . (int)$it['quantity'] . "</td>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#0a1628;'>\$" . number_format((float)$it['total_price'], 2) . "</td>
        </tr>";
    }
    $orderId = htmlspecialchars($order['id']);
    $name    = htmlspecialchars($order['shipping_name']);
    $addr    = htmlspecialchars($order['shipping_street'] . ', ' . $order['shipping_city'] . ', ' . $order['shipping_state'] . ' ' . ($order['shipping_zip'] ?? ''));
    $pm      = htmlspecialchars(ucfirst($order['payment_method']));
    $total   = number_format((float)$order['total'], 2);

    return emailWrap("Order Confirmation #$orderId", "
    <h2 style='margin:0 0 4px;color:#0a1628;font-size:20px;'>Order Confirmed &#10003;</h2>
    <p style='margin:0 0 20px;color:#888;font-size:13px;'>Order #$orderId &mdash; " . date('F j, Y') . "</p>
    <p style='color:#555;font-size:15px;margin:0 0 24px;'>
      Hi $name, thank you for your order! We will process it shortly and be in touch about delivery.
    </p>
    <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;'>
      <tr style='background:#0a1628;'>
        <th style='padding:10px 12px;text-align:left;color:#b3e8f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;'>Item</th>
        <th style='padding:10px 12px;text-align:center;color:#b3e8f5;font-size:11px;text-transform:uppercase;'>Qty</th>
        <th style='padding:10px 12px;text-align:right;color:#b3e8f5;font-size:11px;text-transform:uppercase;'>Total</th>
      </tr>
      $rows
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:24px;'>
      <tr><td></td><td width='200' style='background:#f0fbff;border:1px solid #b3e8f5;border-radius:8px;padding:14px 18px;text-align:right;'>
        <span style='color:#888;font-size:13px;display:block;'>Order Total</span>
        <span style='color:#0a1628;font-size:22px;font-weight:700;'>\$$total CAD</span>
      </td></tr>
    </table>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;'>
      <tr style='background:#f8fafc;'><th colspan='2' style='text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #e8ecf0;'>Shipping To</th></tr>
      <tr><td style='padding:9px 14px;color:#888;font-size:13px;width:30%;'>Name</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$name</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:9px 14px;color:#888;font-size:13px;'>Address</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$addr</td></tr>
      <tr><td style='padding:9px 14px;color:#888;font-size:13px;'>Payment</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$pm</td></tr>
    </table>
    <p style='color:#888;font-size:13px;margin-top:24px;'>Questions? Email us at
      <a href='mailto:info@oasisorchardtech.com' style='color:#1bb0ce;'>info@oasisorchardtech.com</a>
    </p>", "Your order #$orderId has been confirmed — \$$total CAD");
}

// ── Welcome email ─────────────────────────────────────────────────
function welcomeEmailHtml(string $name): string {
    $n = htmlspecialchars($name ?: 'there');
    return emailWrap('Welcome to Oasis Orchard Technologies', "
    <h2 style='margin:0 0 8px;color:#0a1628;font-size:22px;'>Welcome, $n! &#127881;</h2>
    <p style='color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;'>
      Your account has been created successfully. We're excited to have you on board.
    </p>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:10px;overflow:hidden;margin-bottom:24px;'>
      <tr style='background:#f8fafc;'><td colspan='2' style='padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #e8ecf0;font-weight:700;'>What you can do</td></tr>
      <tr><td style='padding:12px 14px;vertical-align:top;'>&#128241;</td><td style='padding:12px 14px;color:#555;font-size:14px;'><strong style='color:#0a1628;'>Browse our phones</strong><br>Shop Grandstream wireless phones and enterprise solutions</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:12px 14px;vertical-align:top;'>&#128222;</td><td style='padding:12px 14px;color:#555;font-size:14px;'><strong style='color:#0a1628;'>VoIP calling</strong><br>Make and receive calls directly from your dashboard</td></tr>
      <tr><td style='padding:12px 14px;vertical-align:top;'>&#128179;</td><td style='padding:12px 14px;color:#555;font-size:14px;'><strong style='color:#0a1628;'>Track your orders</strong><br>View order history and real-time status updates</td></tr>
    </table>
    <div style='text-align:center;margin:28px 0;'>
      <a href='" . SITE_URL . "/dashboard' style='display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;'>
        Go to My Dashboard
      </a>
    </div>
    <p style='color:#888;font-size:13px;'>
      Questions? Reply to this email or contact us at
      <a href='mailto:info@oasisorchardtech.com' style='color:#1bb0ce;'>info@oasisorchardtech.com</a>
    </p>", "Welcome to Oasis Orchard Technologies, $n!");
}

// ── Admin: new user registered ────────────────────────────────────
function newUserAdminHtml(string $name, string $email, string $plan): string {
    $n  = htmlspecialchars($name  ?: 'N/A');
    $e  = htmlspecialchars($email);
    $pl = htmlspecialchars(ucfirst($plan ?: 'basic'));
    $dt = date('F j, Y \a\t g:i A T');
    return emailWrap('New User Registered', "
    <h2 style='margin:0 0 4px;color:#0a1628;font-size:20px;'>&#128100; New User Registered</h2>
    <p style='margin:0 0 24px;color:#888;font-size:13px;'>$dt</p>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;'>
      <tr style='background:#f8fafc;'><th colspan='2' style='text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #e8ecf0;'>User Details</th></tr>
      <tr><td style='padding:10px 14px;color:#888;font-size:13px;width:30%;'>Name</td><td style='padding:10px 14px;color:#0a1628;font-weight:600;font-size:13px;'>$n</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:10px 14px;color:#888;font-size:13px;'>Email</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;'>$e</td></tr>
      <tr><td style='padding:10px 14px;color:#888;font-size:13px;'>Plan</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;'>$pl</td></tr>
    </table>
    <div style='margin-top:24px;'>
      <a href='" . SITE_URL . "/admin/users' style='display:inline-block;background:#0a1628;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;'>
        View in Admin Panel
      </a>
    </div>", "New user registered: $e");
}

// ── Order status update ───────────────────────────────────────────
function orderStatusEmailHtml(array $order, string $newStatus): string {
    $orderId = htmlspecialchars($order['id']);
    $name    = htmlspecialchars($order['shipping_name']);
    $total   = number_format((float)$order['total'], 2);

    $statusInfo = [
        'processing' => ['icon'=>'&#9881;',  'color'=>'#ca8a04', 'bg'=>'#fefce8', 'border'=>'#fde68a', 'msg'=>'Your order is being processed and will be shipped soon.'],
        'shipped'    => ['icon'=>'&#128667;', 'color'=>'#2563eb', 'bg'=>'#eff6ff', 'border'=>'#bfdbfe', 'msg'=>'Great news! Your order is on its way.'],
        'delivered'  => ['icon'=>'&#9989;',  'color'=>'#16a34a', 'bg'=>'#f0fdf4', 'border'=>'#bbf7d0', 'msg'=>'Your order has been delivered. We hope you love it!'],
        'cancelled'  => ['icon'=>'&#10060;', 'color'=>'#dc2626', 'bg'=>'#fef2f2', 'border'=>'#fecaca', 'msg'=>'Your order has been cancelled. If you have questions, please contact us.'],
    ];
    $info = $statusInfo[$newStatus] ?? ['icon'=>'&#128204;', 'color'=>'#555', 'bg'=>'#f8fafc', 'border'=>'#e8ecf0', 'msg'=>'Your order status has been updated.'];

    $label = ucfirst($newStatus);
    return emailWrap("Order #$orderId — $label", "
    <h2 style='margin:0 0 4px;color:#0a1628;font-size:20px;'>Order Update</h2>
    <p style='margin:0 0 24px;color:#888;font-size:13px;'>Order #$orderId &mdash; " . date('F j, Y') . "</p>
    <p style='color:#555;font-size:15px;margin:0 0 20px;'>Hi $name,</p>
    <div style='background:{$info['bg']};border:1px solid {$info['border']};border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;'>
      <div style='font-size:36px;margin-bottom:8px;'>{$info['icon']}</div>
      <div style='font-size:18px;font-weight:700;color:{$info['color']};margin-bottom:6px;'>$label</div>
      <p style='color:#555;font-size:14px;margin:0;'>{$info['msg']}</p>
    </div>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;margin-bottom:24px;'>
      <tr><td style='padding:10px 14px;color:#888;font-size:13px;width:40%;'>Order</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;font-weight:600;'>#$orderId</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:10px 14px;color:#888;font-size:13px;'>Total</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;font-weight:700;'>\$$total CAD</td></tr>
      <tr><td style='padding:10px 14px;color:#888;font-size:13px;'>Status</td><td style='padding:10px 14px;font-weight:700;color:{$info['color']};font-size:13px;'>$label</td></tr>
    </table>
    <p style='color:#888;font-size:13px;'>
      Questions? Contact us at <a href='mailto:info@oasisorchardtech.com' style='color:#1bb0ce;'>info@oasisorchardtech.com</a>
    </p>", "Order #$orderId is now $label");
}

// ── VoIP account provisioned ──────────────────────────────────────
function voipProvisionedHtml(string $name, string $sipUsername, string $sipServer): string {
    $n  = htmlspecialchars($name ?: 'User');
    $su = htmlspecialchars($sipUsername);
    $ss = htmlspecialchars($sipServer);
    return emailWrap('Your VoIP Account is Ready', "
    <h2 style='margin:0 0 8px;color:#0a1628;font-size:22px;'>&#128222; Your VoIP Account is Ready!</h2>
    <p style='color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;'>
      Hi $n, your VoIP calling account has been set up. You can now make and receive calls directly from your dashboard.
    </p>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #b3e8f5;border-radius:10px;overflow:hidden;margin-bottom:24px;background:#f0fbff;'>
      <tr style='background:#0a1628;'><td colspan='2' style='padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#b3e8f5;font-weight:700;'>SIP Account Details</td></tr>
      <tr><td style='padding:10px 14px;color:#555;font-size:13px;width:35%;'>SIP Username</td><td style='padding:10px 14px;color:#0a1628;font-weight:700;font-size:13px;font-family:monospace;'>$su</td></tr>
      <tr style='background:#e0f7fb;'><td style='padding:10px 14px;color:#555;font-size:13px;'>Server</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;font-family:monospace;'>$ss</td></tr>
    </table>
    <div style='text-align:center;margin:28px 0;'>
      <a href='" . SITE_URL . "/dashboard/voip' style='display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;'>
        Start Calling Now
      </a>
    </div>
    <p style='color:#888;font-size:13px;'>
      Need help? Contact us at <a href='mailto:info@oasisorchardtech.com' style='color:#1bb0ce;'>info@oasisorchardtech.com</a>
    </p>", "Your VoIP account is ready — start calling now");
}

// ── Admin: new support message ────────────────────────────────────
function newSupportMsgAdminHtml(string $userName, string $userEmail, string $subject, string $message): string {
    $n  = htmlspecialchars($userName  ?: 'User');
    $e  = htmlspecialchars($userEmail);
    $s  = htmlspecialchars($subject);
    $m  = nl2br(htmlspecialchars($message));
    $dt = date('F j, Y \a\t g:i A');
    return emailWrap('New Support Message', "
    <h2 style='margin:0 0 4px;color:#0a1628;font-size:20px;'>&#128203; New Support Message</h2>
    <p style='margin:0 0 24px;color:#888;font-size:13px;'>$dt</p>
    <table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;margin-bottom:20px;'>
      <tr><td style='padding:10px 14px;color:#888;font-size:13px;width:25%;'>From</td><td style='padding:10px 14px;color:#0a1628;font-weight:600;font-size:13px;'>$n &lt;$e&gt;</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:10px 14px;color:#888;font-size:13px;'>Subject</td><td style='padding:10px 14px;color:#0a1628;font-size:13px;font-weight:600;'>$s</td></tr>
    </table>
    <div style='background:#f8fafc;border:1px solid #e8ecf0;border-radius:8px;padding:16px 20px;margin-bottom:24px;'>
      <p style='margin:0;color:#555;font-size:14px;line-height:1.7;'>$m</p>
    </div>
    <a href='" . SITE_URL . "/admin/support' style='display:inline-block;background:#0a1628;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;'>
      Reply in Admin Panel
    </a>", "Support: $s — from $n");
}

// ── User: support reply from admin ────────────────────────────────
function supportReplyUserHtml(string $name, string $subject, string $adminMessage): string {
    $n  = htmlspecialchars($name ?: 'User');
    $s  = htmlspecialchars($subject);
    $m  = nl2br(htmlspecialchars($adminMessage));
    return emailWrap('Support Reply', "
    <h2 style='margin:0 0 8px;color:#0a1628;font-size:22px;'>Reply to Your Support Request</h2>
    <p style='color:#555;font-size:15px;line-height:1.7;margin:0 0 8px;'>Hi $n,</p>
    <p style='color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;'>
      Our team has responded to your support request: <strong>$s</strong>
    </p>
    <div style='background:#f0fbff;border-left:4px solid #1bb0ce;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;'>
      <p style='margin:0;color:#0a1628;font-size:14px;line-height:1.7;'>$m</p>
    </div>
    <div style='text-align:center;margin:24px 0;'>
      <a href='" . SITE_URL . "/dashboard/support' style='display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:700;'>
        View in Dashboard
      </a>
    </div>
    <p style='color:#888;font-size:13px;'>
      To reply, visit your dashboard or email <a href='mailto:info@oasisorchardtech.com' style='color:#1bb0ce;'>info@oasisorchardtech.com</a>
    </p>", "Support reply: $s");
}

// ── DB-driven template engine ─────────────────────────────────────

function render_template(string $id, array $vars, string $wrapTitle = ''): ?array {
    global $pdo;
    if (!isset($pdo)) return null;
    try {
        $stmt = $pdo->prepare('SELECT subject, body_html, is_active FROM email_templates WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || !$row['is_active']) return null;
        $subject = $row['subject'];
        $body    = $row['body_html'];
        foreach ($vars as $k => $v) {
            $safe    = htmlspecialchars((string)$v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
            $bodyVal = str_ends_with((string)$k, '_html') ? (string)$v : $safe;
            $subject = str_replace('{{' . $k . '}}', $safe, $subject);
            $body    = str_replace('{{' . $k . '}}', $bodyVal, $body);
        }
        return ['subject' => $subject, 'html' => emailWrap($wrapTitle ?: $subject, $body)];
    } catch (Throwable $e) {
        return null;
    }
}

function send_templated_mail(string $id, string $toEmail, string $toName, array $vars, string $wrapTitle = ''): bool {
    $r = render_template($id, $vars, $wrapTitle);
    if (!$r) return false;
    return sendMail($toEmail, $toName, $r['subject'], $r['html']);
}

function admin_templated_mail(string $id, array $vars, string $wrapTitle = ''): bool {
    $to = admin_notify_email();
    if (!$to) return false;
    return send_templated_mail($id, $to, 'Admin', $vars, $wrapTitle);
}

function default_email_templates(): array {
    return [
        'welcome' => [
            'name'      => 'Welcome Email',
            'subject'   => 'Welcome to Oasis Orchard Technologies!',
            'variables' => '["name","dashboard_url"]',
            'body_html' => '<h2 style="margin:0 0 8px;color:#0a1628;font-size:22px;">Welcome, {{name}}!</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">Your account has been created successfully. We&rsquo;re excited to have you on board.</p>
<div style="text-align:center;margin:28px 0;">
  <a href="{{dashboard_url}}" style="display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;">Go to My Dashboard</a>
</div>
<p style="color:#888;font-size:13px;">Questions? Email us at <a href="mailto:info@oasisorchardtech.com" style="color:#1bb0ce;">info@oasisorchardtech.com</a></p>',
        ],
        'email_verification' => [
            'name'      => 'Email Verification',
            'subject'   => 'Verify Your Email — Oasis Orchard Technologies',
            'variables' => '["name","verify_url"]',
            'body_html' => '<h2 style="margin:0 0 8px;color:#0a1628;font-size:22px;">Welcome, {{name}}!</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Thanks for signing up. Click the button below to verify your email address and activate your account.</p>
<div style="text-align:center;margin:32px 0;">
  <a href="{{verify_url}}" style="display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;">Verify Email Address</a>
</div>
<p style="color:#888;font-size:13px;">This link expires in 24 hours. If you did not create an account, ignore this email.</p>
<p style="color:#aaa;font-size:12px;margin-top:12px;word-break:break-all;">Or copy this link: <span style="color:#1bb0ce;">{{verify_url}}</span></p>',
        ],
        'password_reset' => [
            'name'      => 'Password Reset',
            'subject'   => 'Reset Your Password — Oasis Orchard Technologies',
            'variables' => '["name","reset_url"]',
            'body_html' => '<h2 style="margin:0 0 8px;color:#0a1628;font-size:22px;">Password Reset Request</h2>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 8px;">Hi {{name}},</p>
<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">We received a request to reset the password for your account. Click the button below to choose a new password.</p>
<div style="text-align:center;margin:32px 0;">
  <a href="{{reset_url}}" style="display:inline-block;background:#0a1628;color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;">Reset Password</a>
</div>
<p style="color:#888;font-size:13px;">This link expires in <strong>1 hour</strong>. If you did not request this, no action is needed.</p>
<p style="color:#aaa;font-size:12px;margin-top:12px;word-break:break-all;">Or copy this link: <span style="color:#1bb0ce;">{{reset_url}}</span></p>',
        ],
        'order_confirmation' => [
            'name'      => 'Order Confirmation',
            'subject'   => 'Order Confirmed — #{{order_id}}',
            'variables' => '["shipping_name","order_id","order_date","total","payment_method","shipping_address","items_html"]',
            'body_html' => '<h2 style="margin:0 0 4px;color:#0a1628;font-size:20px;">Order Confirmed &#10003;</h2>
<p style="margin:0 0 20px;color:#888;font-size:13px;">Order #{{order_id}} &mdash; {{order_date}}</p>
<p style="color:#555;font-size:15px;margin:0 0 24px;">Hi {{shipping_name}}, thank you for your order! We will process it shortly and be in touch about delivery.</p>
{{items_html}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td></td>
  <td width="200" style="background:#f0fbff;border:1px solid #b3e8f5;border-radius:8px;padding:14px 18px;text-align:right;">
    <span style="color:#888;font-size:13px;display:block;">Order Total</span>
    <span style="color:#0a1628;font-size:22px;font-weight:700;">${{total}} CAD</span>
  </td>
</tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;">
  <tr style="background:#f8fafc;"><th colspan="2" style="text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#888;border-bottom:1px solid #e8ecf0;letter-spacing:.5px;">Shipping To</th></tr>
  <tr><td style="padding:9px 14px;color:#888;font-size:13px;width:30%;">Name</td><td style="padding:9px 14px;color:#0a1628;font-size:13px;">{{shipping_name}}</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:9px 14px;color:#888;font-size:13px;">Address</td><td style="padding:9px 14px;color:#0a1628;font-size:13px;">{{shipping_address}}</td></tr>
  <tr><td style="padding:9px 14px;color:#888;font-size:13px;">Payment</td><td style="padding:9px 14px;color:#0a1628;font-size:13px;">{{payment_method}}</td></tr>
</table>
<p style="color:#888;font-size:13px;margin-top:24px;">Questions? Email us at <a href="mailto:info@oasisorchardtech.com" style="color:#1bb0ce;">info@oasisorchardtech.com</a></p>',
        ],
        'order_status_update' => [
            'name'      => 'Order Status Update',
            'subject'   => 'Order #{{order_id}} — {{status_label}}',
            'variables' => '["shipping_name","order_id","order_date","status_label","total","status_message","status_color","status_bg","status_border"]',
            'body_html' => '<h2 style="margin:0 0 4px;color:#0a1628;font-size:20px;">Order Update</h2>
<p style="margin:0 0 20px;color:#888;font-size:13px;">Order #{{order_id}} &mdash; {{order_date}}</p>
<p style="color:#555;font-size:15px;margin:0 0 20px;">Hi {{shipping_name}},</p>
<div style="background:{{status_bg}};border:1px solid {{status_border}};border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
  <div style="font-size:18px;font-weight:700;color:{{status_color}};margin-bottom:6px;">{{status_label}}</div>
  <p style="color:#555;font-size:14px;margin:0;">{{status_message}}</p>
</div>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
  <tr><td style="padding:10px 14px;color:#888;font-size:13px;width:40%;">Order</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;font-weight:600;">#{{order_id}}</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#888;font-size:13px;">Total</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;font-weight:700;">${{total}} CAD</td></tr>
  <tr><td style="padding:10px 14px;color:#888;font-size:13px;">Status</td><td style="padding:10px 14px;font-weight:700;color:{{status_color}};font-size:13px;">{{status_label}}</td></tr>
</table>
<p style="color:#888;font-size:13px;">Questions? Contact us at <a href="mailto:info@oasisorchardtech.com" style="color:#1bb0ce;">info@oasisorchardtech.com</a></p>',
        ],
        'new_user_admin' => [
            'name'      => 'New User Alert (Admin)',
            'subject'   => 'New User Registered — {{name}}',
            'variables' => '["name","email","plan","date","admin_url"]',
            'body_html' => '<h2 style="margin:0 0 4px;color:#0a1628;font-size:20px;">&#128100; New User Registered</h2>
<p style="margin:0 0 24px;color:#888;font-size:13px;">{{date}}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;">
  <tr style="background:#f8fafc;"><th colspan="2" style="text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #e8ecf0;">User Details</th></tr>
  <tr><td style="padding:10px 14px;color:#888;font-size:13px;width:30%;">Name</td><td style="padding:10px 14px;color:#0a1628;font-weight:600;font-size:13px;">{{name}}</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#888;font-size:13px;">Email</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;">{{email}}</td></tr>
  <tr><td style="padding:10px 14px;color:#888;font-size:13px;">Plan</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;">{{plan}}</td></tr>
</table>
<div style="margin-top:24px;">
  <a href="{{admin_url}}" style="display:inline-block;background:#0a1628;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;">View in Admin Panel</a>
</div>',
        ],
        'voip_provisioned' => [
            'name'      => 'VoIP Account Provisioned',
            'subject'   => 'Your VoIP Account is Ready!',
            'variables' => '["name","sip_username","sip_server","voip_url"]',
            'body_html' => '<h2 style="margin:0 0 8px;color:#0a1628;font-size:22px;">&#128222; Your VoIP Account is Ready!</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">Hi {{name}}, your VoIP calling account has been set up. You can now make and receive calls directly from your dashboard.</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #b3e8f5;border-radius:10px;overflow:hidden;margin-bottom:24px;background:#f0fbff;">
  <tr style="background:#0a1628;"><td colspan="2" style="padding:10px 14px;font-size:11px;text-transform:uppercase;color:#b3e8f5;font-weight:700;">SIP Account Details</td></tr>
  <tr><td style="padding:10px 14px;color:#555;font-size:13px;width:35%;">SIP Username</td><td style="padding:10px 14px;color:#0a1628;font-weight:700;font-size:13px;font-family:monospace;">{{sip_username}}</td></tr>
  <tr style="background:#e0f7fb;"><td style="padding:10px 14px;color:#555;font-size:13px;">Server</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;font-family:monospace;">{{sip_server}}</td></tr>
</table>
<div style="text-align:center;margin:28px 0;">
  <a href="{{voip_url}}" style="display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;">Start Calling Now</a>
</div>
<p style="color:#888;font-size:13px;">Need help? Contact us at <a href="mailto:info@oasisorchardtech.com" style="color:#1bb0ce;">info@oasisorchardtech.com</a></p>',
        ],
        'support_new_admin' => [
            'name'      => 'New Support Message (Admin)',
            'subject'   => 'Support: {{subject}} — from {{user_name}}',
            'variables' => '["user_name","user_email","subject","message_html","date","admin_url"]',
            'body_html' => '<h2 style="margin:0 0 4px;color:#0a1628;font-size:20px;">&#128203; New Support Message</h2>
<p style="margin:0 0 24px;color:#888;font-size:13px;">{{date}}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
  <tr><td style="padding:10px 14px;color:#888;font-size:13px;width:25%;">From</td><td style="padding:10px 14px;color:#0a1628;font-weight:600;font-size:13px;">{{user_name}} &lt;{{user_email}}&gt;</td></tr>
  <tr style="background:#f8fafc;"><td style="padding:10px 14px;color:#888;font-size:13px;">Subject</td><td style="padding:10px 14px;color:#0a1628;font-size:13px;font-weight:600;">{{subject}}</td></tr>
</table>
<div style="background:#f8fafc;border:1px solid #e8ecf0;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">{{message_html}}</p>
</div>
<a href="{{admin_url}}" style="display:inline-block;background:#0a1628;color:#fff;text-decoration:none;padding:11px 24px;border-radius:8px;font-size:14px;font-weight:700;">Reply in Admin Panel</a>',
        ],
        'support_reply' => [
            'name'      => 'Support Reply to User',
            'subject'   => 'We replied to your support request',
            'variables' => '["name","subject","admin_message_html","dashboard_url"]',
            'body_html' => '<h2 style="margin:0 0 8px;color:#0a1628;font-size:22px;">Reply to Your Support Request</h2>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 8px;">Hi {{name}},</p>
<p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 20px;">Our team has responded to your support request: <strong>{{subject}}</strong></p>
<div style="background:#f0fbff;border-left:4px solid #1bb0ce;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;color:#0a1628;font-size:14px;line-height:1.7;">{{admin_message_html}}</p>
</div>
<div style="text-align:center;margin:24px 0;">
  <a href="{{dashboard_url}}" style="display:inline-block;background:linear-gradient(135deg,#0a1628,#1bb0ce);color:#fff;text-decoration:none;padding:13px 30px;border-radius:8px;font-size:15px;font-weight:700;">View in Dashboard</a>
</div>
<p style="color:#888;font-size:13px;">To reply, email <a href="mailto:info@oasisorchardtech.com" style="color:#1bb0ce;">info@oasisorchardtech.com</a></p>',
        ],
    ];
}

function seed_email_templates(): void {
    global $pdo;
    if (!isset($pdo)) return;
    try {
        $count = (int)$pdo->query('SELECT COUNT(*) FROM email_templates')->fetchColumn();
        if ($count > 0) return;
        $stmt = $pdo->prepare('INSERT IGNORE INTO email_templates (id, name, subject, body_html, variables, is_active, is_system) VALUES (?,?,?,?,?,1,1)');
        foreach (default_email_templates() as $id => $t) {
            $stmt->execute([$id, $t['name'], $t['subject'], $t['body_html'], $t['variables']]);
        }
    } catch (Throwable $e) {
        error_log('[Mailer] seed_email_templates: ' . $e->getMessage());
    }
}
