<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/mailer.php';

// ── Helpers ───────────────────────────────────────────────────
function send($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}
function err($msg, $status = 400) { send(['error' => $msg], $status); }

function body() {
    static $b = null;
    if ($b === null) $b = json_decode(file_get_contents('php://input'), true) ?? [];
    return $b;
}

function token() {
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', $h, $m) ? $m[1] : null;
}

function authUser($pdo, $requireAdmin = false) {
    $t = token();
    if (!$t) err('Unauthorized', 401);
    $s = $pdo->prepare('SELECT u.* FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=? AND s.expires_at > NOW()');
    $s->execute([$t]);
    $u = $s->fetch();
    if (!$u) err('Unauthorized', 401);
    if ($requireAdmin && $u['role'] !== 'admin') err('Forbidden', 403);
    return $u;
}

function decodeJson($val) {
    if (is_array($val)) return $val;
    if ($val === null || $val === '') return [];
    $d = json_decode($val, true);
    return is_array($d) ? $d : [];
}

function productRow($row) {
    $row['specs']    = is_string($row['specs'])    ? (json_decode($row['specs'], true) ?? (object)[]) : ($row['specs'] ?? (object)[]);
    $row['features'] = is_string($row['features']) ? (json_decode($row['features'], true) ?? [])      : ($row['features'] ?? []);
    $row['on_sale']  = (bool) $row['on_sale'];
    $row['is_active'] = (bool) $row['is_active'];
    return $row;
}

// ── Notification helpers ──────────────────────────────────────
function notif_settings($pdo) {
    $rows = $pdo->query("SELECT `key`,`value` FROM notification_settings")->fetchAll();
    $m = [];
    foreach ($rows as $r) $m[$r['key']] = $r['value'];
    return $m;
}

function notif_set($pdo, $key, $val) {
    $pdo->prepare("INSERT INTO notification_settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)")->execute([$key,$val]);
}

function build_order_email($order, $items) {
    $rows = '';
    foreach ($items as $it) {
        $rows .= "<tr>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;color:#0a1628;'>" . htmlspecialchars($it['product_name']) . "</td>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#555;'>" . (int)$it['quantity'] . "</td>
          <td style='padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#0a1628;'>$" . number_format((float)$it['total_price'],2) . "</td>
        </tr>";
    }
    $year    = date('Y');
    $orderId = htmlspecialchars($order['id']);
    $name    = htmlspecialchars($order['shipping_name']);
    $email   = htmlspecialchars($order['shipping_email']);
    $phone   = htmlspecialchars($order['shipping_phone']);
    $addr    = htmlspecialchars($order['shipping_street'] . ', ' . $order['shipping_city'] . ', ' . $order['shipping_state'] . ' ' . $order['shipping_zip']);
    $pm      = htmlspecialchars(ucfirst($order['payment_method']));
    $ps      = htmlspecialchars(ucfirst($order['payment_status']));
    $total   = number_format((float)$order['total'],2);
    return "<!DOCTYPE html><html><head><meta charset='utf-8'></head>
<body style='margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;'>
<table width='100%' cellpadding='0' cellspacing='0'><tr><td align='center' style='padding:32px 16px;'>
<table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>
  <!-- Header -->
  <tr><td style='background:linear-gradient(135deg,#0a1628,#1bb0ce);padding:28px 32px;border-radius:12px 12px 0 0;'>
    <h1 style='margin:0;color:#fff;font-size:22px;'>Oasis Orchard Technologies</h1>
    <p style='margin:6px 0 0;color:#b3e8f5;font-size:14px;'>&#128722; New Order Received</p>
  </td></tr>
  <!-- Body -->
  <tr><td style='background:#fff;padding:28px 32px;border:1px solid #e8ecf0;border-top:none;'>
    <h2 style='margin:0 0 4px;color:#0a1628;font-size:18px;'>Order #$orderId</h2>
    <p style='margin:0 0 24px;color:#888;font-size:13px;'>Placed on " . date('F j, Y \a\t g:i A') . "</p>

    <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:24px;border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;'>
      <tr style='background:#f8fafc;'><th colspan='2' style='text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#888;border-bottom:1px solid #e8ecf0;'>Customer</th></tr>
      <tr><td style='padding:9px 14px;color:#888;font-size:13px;width:35%;'>Name</td><td style='padding:9px 14px;color:#0a1628;font-weight:600;font-size:13px;'>$name</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:9px 14px;color:#888;font-size:13px;'>Email</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$email</td></tr>
      <tr><td style='padding:9px 14px;color:#888;font-size:13px;'>Phone</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$phone</td></tr>
      <tr style='background:#f8fafc;'><td style='padding:9px 14px;color:#888;font-size:13px;'>Ship to</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$addr</td></tr>
      <tr><td style='padding:9px 14px;color:#888;font-size:13px;'>Payment</td><td style='padding:9px 14px;color:#0a1628;font-size:13px;'>$pm &bull; <span style='color:" . ($order['payment_status']==='paid'?'#16a34a':'#ca8a04') . ";font-weight:600;'>$ps</span></td></tr>
    </table>

    <table width='100%' cellpadding='0' cellspacing='0' style='margin-bottom:16px;border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;'>
      <tr style='background:#0a1628;'><th style='padding:10px 12px;text-align:left;color:#b3e8f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;'>Item</th><th style='padding:10px 12px;text-align:center;color:#b3e8f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;'>Qty</th><th style='padding:10px 12px;text-align:right;color:#b3e8f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;'>Total</th></tr>
      $rows
    </table>

    <table width='100%' cellpadding='0' cellspacing='0'><tr>
      <td></td>
      <td width='200' style='background:#f0fbff;border:1px solid #b3e8f5;border-radius:8px;padding:14px 18px;text-align:right;'>
        <span style='color:#888;font-size:13px;display:block;'>Order Total</span>
        <span style='color:#0a1628;font-size:22px;font-weight:700;'>$$total CAD</span>
      </td>
    </tr></table>
  </td></tr>
  <!-- Footer -->
  <tr><td style='background:#f8fafc;padding:16px 32px;border:1px solid #e8ecf0;border-top:none;border-radius:0 0 12px 12px;text-align:center;'>
    <p style='margin:0;color:#aaa;font-size:12px;'>&copy; $year Oasis Orchard Technologies &mdash; Admin Notification</p>
  </td></tr>
</table></td></tr></table>
</body></html>";
}

function send_email_notification($pdo, $order, $items) {
    $cfg = notif_settings($pdo);
    if (($cfg['email_enabled'] ?? 'false') !== 'true') return;
    $to = $cfg['admin_email'] ?? '';
    if (!$to) return;
    $subject = '🛒 New Order #' . $order['id'] . ' — $' . number_format((float)$order['total'],2) . ' CAD';
    $html    = build_order_email($order, $items);
    sendMail($to, 'Admin', $subject, $html);
}

function send_customer_order_email(array $order, array $items): void {
    $customerEmail = $order['shipping_email'] ?? '';
    $customerName  = $order['shipping_name']  ?? 'Customer';
    if (!$customerEmail) return;

    $itemsHtml = '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;">'
        . '<tr style="background:#0a1628;"><th style="padding:10px 12px;text-align:left;color:#b3e8f5;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Item</th>'
        . '<th style="padding:10px 12px;text-align:center;color:#b3e8f5;font-size:11px;text-transform:uppercase;">Qty</th>'
        . '<th style="padding:10px 12px;text-align:right;color:#b3e8f5;font-size:11px;text-transform:uppercase;">Total</th></tr>';
    foreach ($items as $it) {
        $itemsHtml .= '<tr><td style="padding:10px 12px;border-bottom:1px solid #eee;color:#0a1628;">' . htmlspecialchars($it['product_name'])
            . '</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;color:#555;">' . (int)$it['quantity']
            . '</td><td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#0a1628;">$' . number_format((float)$it['total_price'], 2) . '</td></tr>';
    }
    $itemsHtml .= '</table>';

    $addr = trim(($order['shipping_street'] ?? '') . ', ' . ($order['shipping_city'] ?? '') . ', ' . ($order['shipping_state'] ?? ''), ', ');
    $sent = send_templated_mail('order_confirmation', $customerEmail, $customerName, [
        'shipping_name'    => $customerName,
        'order_id'         => $order['id'],
        'order_date'       => date('F j, Y'),
        'total'            => number_format((float)$order['total'], 2),
        'payment_method'   => ucfirst($order['payment_method'] ?? 'N/A'),
        'shipping_address' => $addr,
        'items_html'       => $itemsHtml,
    ]);
    if (!$sent) sendMail($customerEmail, $customerName, 'Order Confirmed — #' . $order['id'], orderConfirmationHtml($order, $items));
}

function build_whatsapp_message($order, $items) {
    $lines   = ["🛒 *New Order Received!*", ""];
    $lines[] = "📋 *Order:* " . $order['id'];
    $lines[] = "👤 *Customer:* " . $order['shipping_name'];
    $lines[] = "📧 *Email:* " . $order['shipping_email'];
    $lines[] = "📞 *Phone:* " . $order['shipping_phone'];
    $lines[] = "📍 *Address:* " . $order['shipping_street'] . ", " . $order['shipping_city'] . ", " . $order['shipping_state'];
    $lines[] = "";
    $lines[] = "🛍️ *Items:*";
    foreach ($items as $it)
        $lines[] = "  • " . $it['product_name'] . " × " . $it['quantity'] . " — $" . number_format((float)$it['total_price'],2);
    $lines[] = "";
    $lines[] = "💰 *Total:* $" . number_format((float)$order['total'],2) . " CAD";
    $lines[] = "💳 *Payment:* " . ucfirst($order['payment_method']) . " (" . $order['payment_status'] . ")";
    $lines[] = "";
    $lines[] = "Log in to admin panel to process this order.";
    return implode("\n", $lines);
}

function send_whatsapp_notification($pdo, $order, $items) {
    $cfg = notif_settings($pdo);
    if (($cfg['whatsapp_enabled'] ?? 'false') !== 'true') return;
    $provider = $cfg['whatsapp_provider'] ?? 'callmebot';
    $phone    = preg_replace('/[^0-9+]/', '', $cfg['whatsapp_phone'] ?? '');
    $apikey   = $cfg['whatsapp_apikey'] ?? '';
    if (!$phone) return;
    $message  = build_whatsapp_message($order, $items);

    if ($provider === 'callmebot') {
        $url = 'https://api.callmebot.com/whatsapp.php?phone=' . urlencode($phone)
             . '&text=' . urlencode($message) . '&apikey=' . urlencode($apikey);
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
        curl_exec($ch); curl_close($ch);

    } elseif ($provider === 'ultramsg') {
        $instance = $cfg['whatsapp_instance'] ?? '';
        $ch = curl_init("https://api.ultramsg.com/{$instance}/messages/chat");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query(['token'=>$apikey,'to'=>$phone,'body'=>$message]),
            CURLOPT_HTTPHEADER     => ['Content-Type: application/x-www-form-urlencoded'],
        ]);
        curl_exec($ch); curl_close($ch);

    } elseif ($provider === 'twilio') {
        $sid    = $cfg['whatsapp_sid'] ?? '';
        $secret = $cfg['whatsapp_secret'] ?? '';
        $from   = $cfg['whatsapp_from'] ?? 'whatsapp:+14155238886';
        $ch = curl_init("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_USERPWD        => $sid . ':' . $secret,
            CURLOPT_POSTFIELDS     => http_build_query(['From'=>$from,'To'=>'whatsapp:'.$phone,'Body'=>$message]),
        ]);
        curl_exec($ch); curl_close($ch);
    }
}

// ── Email triggers ────────────────────────────────────────────────

function trigger_welcome_email(string $email, string $name): void {
    try {
        $site = defined('SITE_URL') ? SITE_URL : '';
        $sent = send_templated_mail('welcome', $email, $name ?: 'User', [
            'name'          => $name ?: 'there',
            'dashboard_url' => $site . '/dashboard',
        ]);
        if (!$sent) sendMail($email, $name ?: 'User', 'Welcome to Oasis Orchard Technologies', welcomeEmailHtml($name));
    } catch (Throwable $e) { error_log('[Email] welcome: ' . $e->getMessage()); }
}

function trigger_new_user_admin(string $email, string $name, string $plan): void {
    try {
        $site = defined('SITE_URL') ? SITE_URL : '';
        $sent = admin_templated_mail('new_user_admin', [
            'name'      => $name ?: 'N/A',
            'email'     => $email,
            'plan'      => ucfirst($plan ?: 'basic'),
            'date'      => date('F j, Y \a\t g:i A T'),
            'admin_url' => $site . '/admin/users',
        ]);
        if (!$sent) notify_admin('New User Registered — ' . ($name ?: $email), newUserAdminHtml($name, $email, $plan));
    } catch (Throwable $e) { error_log('[Email] new_user_admin: ' . $e->getMessage()); }
}

function trigger_order_status_email($pdo, string $orderId, string $newStatus): void {
    try {
        $s = $pdo->prepare('SELECT * FROM orders WHERE id=?');
        $s->execute([$orderId]);
        $order = $s->fetch();
        if (!$order || empty($order['shipping_email'])) return;
        $statusInfo = [
            'processing' => ['label'=>'Processing','color'=>'#ca8a04','bg'=>'#fefce8','border'=>'#fde68a','msg'=>'Your order is being processed and will be shipped soon.'],
            'shipped'    => ['label'=>'Shipped',   'color'=>'#2563eb','bg'=>'#eff6ff','border'=>'#bfdbfe','msg'=>'Your order is on its way!'],
            'delivered'  => ['label'=>'Delivered', 'color'=>'#16a34a','bg'=>'#f0fdf4','border'=>'#bbf7d0','msg'=>'Your order has been delivered. We hope you love it!'],
            'cancelled'  => ['label'=>'Cancelled', 'color'=>'#dc2626','bg'=>'#fef2f2','border'=>'#fecaca','msg'=>'Your order has been cancelled. Contact us if you have questions.'],
            'refunded'   => ['label'=>'Refunded',  'color'=>'#7c3aed','bg'=>'#f5f3ff','border'=>'#ddd6fe','msg'=>'Your payment has been refunded. It may take 5-10 business days to appear on your statement.'],
        ];
        $info = $statusInfo[$newStatus] ?? ['label'=>ucfirst($newStatus),'color'=>'#555','bg'=>'#f8fafc','border'=>'#e8ecf0','msg'=>'Your order status has been updated.'];
        $sent = send_templated_mail('order_status_update', $order['shipping_email'], $order['shipping_name'], [
            'shipping_name'  => $order['shipping_name'],
            'order_id'       => $orderId,
            'order_date'     => date('F j, Y'),
            'status_label'   => $info['label'],
            'total'          => number_format((float)$order['total'], 2),
            'status_message' => $info['msg'],
            'status_color'   => $info['color'],
            'status_bg'      => $info['bg'],
            'status_border'  => $info['border'],
        ]);
        if (!$sent) sendMail($order['shipping_email'], $order['shipping_name'],
            'Order #' . $orderId . ' — ' . ucfirst($newStatus), orderStatusEmailHtml($order, $newStatus));
    } catch (Throwable $e) { error_log('[Email] order_status: ' . $e->getMessage()); }
}

function trigger_order_confirmation($pdo, string $orderId): void {
    try {
        $s = $pdo->prepare('SELECT * FROM orders WHERE id=?');
        $s->execute([$orderId]);
        $order = $s->fetch();
        if (!$order || empty($order['shipping_email'])) return;

        $si = $pdo->prepare('SELECT * FROM order_items WHERE order_id=?');
        $si->execute([$orderId]);
        $items = $si->fetchAll();

        $rows = '';
        foreach ($items as $it) {
            $pn  = htmlspecialchars($it['product_name']);
            $qty = (int)$it['quantity'];
            $tp  = number_format((float)$it['total_price'], 2);
            $rows .= "<tr><td style='padding:9px 14px;color:#0a1628;font-size:13px;border-bottom:1px solid #f1f5f9;'>$pn</td>"
                   . "<td style='padding:9px 14px;color:#888;font-size:13px;border-bottom:1px solid #f1f5f9;text-align:center;'>&times;$qty</td>"
                   . "<td style='padding:9px 14px;color:#0a1628;font-size:13px;font-weight:600;border-bottom:1px solid #f1f5f9;text-align:right;'>\$$tp</td></tr>";
        }
        $itemsHtml = "<table width='100%' cellpadding='0' cellspacing='0' style='border:1px solid #e8ecf0;border-radius:8px;overflow:hidden;margin-bottom:16px;'>"
                   . "<tr style='background:#f8fafc;'><th style='text-align:left;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#888;letter-spacing:.5px;'>Item</th>"
                   . "<th style='padding:10px 14px;font-size:11px;text-transform:uppercase;color:#888;'>Qty</th>"
                   . "<th style='text-align:right;padding:10px 14px;font-size:11px;text-transform:uppercase;color:#888;'>Total</th></tr>$rows</table>";

        $address = implode(', ', array_filter([
            $order['shipping_street'] ?? '',
            $order['shipping_city'] ?? '',
            trim(($order['shipping_state'] ?? '') . ' ' . ($order['shipping_zip'] ?? '')),
            $order['shipping_country'] ?? '',
        ]));

        $sent = send_templated_mail('order_confirmation', $order['shipping_email'], $order['shipping_name'], [
            'shipping_name'    => $order['shipping_name'],
            'order_id'         => $orderId,
            'order_date'       => date('F j, Y'),
            'total'            => number_format((float)$order['total'], 2),
            'payment_method'   => ucfirst($order['payment_method'] ?? 'card'),
            'shipping_address' => htmlspecialchars($address),
            'items_html'       => $itemsHtml,
        ]);
        if (!$sent) {
            $name = htmlspecialchars($order['shipping_name']);
            sendMail($order['shipping_email'], $order['shipping_name'], 'Order Confirmed — #' . $orderId,
                emailWrap('Order Confirmed', "
                <h2 style='margin:0 0 8px;color:#0a1628;font-size:20px;'>Order Confirmed &#10003;</h2>
                <p style='color:#555;font-size:15px;margin:0 0 20px;'>Hi $name, thank you for your order! Order #$orderId has been received and paid.</p>
                $itemsHtml
                <p style='color:#0a1628;font-size:16px;font-weight:700;'>Total: \$" . number_format((float)$order['total'], 2) . " CAD</p>
                <p style='color:#888;font-size:13px;'>Shipping to: " . htmlspecialchars($address) . "</p>",
                "Order #$orderId confirmed"));
        }
    } catch (Throwable $e) { error_log('[Email] order_confirmation: ' . $e->getMessage()); }
}

function trigger_voip_provisioned($pdo, string $userId, string $sipUsername, string $sipServer): void {
    try {
        $s = $pdo->prepare('SELECT u.email, p.name FROM users u LEFT JOIN profiles p ON p.id=u.id WHERE u.id=?');
        $s->execute([$userId]);
        $row = $s->fetch();
        if (!$row || empty($row['email'])) return;
        $site = defined('SITE_URL') ? SITE_URL : '';
        $name = $row['name'] ?: 'User';
        $sent = send_templated_mail('voip_provisioned', $row['email'], $name, [
            'name'         => $name,
            'sip_username' => $sipUsername,
            'sip_server'   => $sipServer,
            'voip_url'     => $site . '/dashboard/voip',
        ]);
        if (!$sent) sendMail($row['email'], $name, 'Your VoIP Account is Ready', voipProvisionedHtml($name, $sipUsername, $sipServer));
    } catch (Throwable $e) { error_log('[Email] voip_provisioned: ' . $e->getMessage()); }
}

function trigger_support_msg_admin(string $userName, string $userEmail, string $subject, string $message): void {
    try {
        $site = defined('SITE_URL') ? SITE_URL : '';
        $sent = admin_templated_mail('support_new_admin', [
            'user_name'    => $userName ?: 'User',
            'user_email'   => $userEmail,
            'subject'      => $subject,
            'message_html' => nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')),
            'date'         => date('F j, Y \a\t g:i A'),
            'admin_url'    => $site . '/admin/support',
        ]);
        if (!$sent) notify_admin('Support: ' . $subject, newSupportMsgAdminHtml($userName, $userEmail, $subject, $message));
    } catch (Throwable $e) { error_log('[Email] support_admin: ' . $e->getMessage()); }
}

function trigger_support_reply_user(string $email, string $name, string $subject, string $adminMessage): void {
    try {
        $site = defined('SITE_URL') ? SITE_URL : '';
        $sent = send_templated_mail('support_reply', $email, $name ?: 'User', [
            'name'                => $name ?: 'User',
            'subject'             => $subject,
            'admin_message_html'  => nl2br(htmlspecialchars($adminMessage, ENT_QUOTES, 'UTF-8')),
            'dashboard_url'       => $site . '/dashboard/support',
        ]);
        if (!$sent) sendMail($email, $name ?: 'User', 'We replied to your support request', supportReplyUserHtml($name, $subject, $adminMessage));
    } catch (Throwable $e) { error_log('[Email] support_reply: ' . $e->getMessage()); }
}

function notify_admin_new_order($pdo, $orderId) {
    try {
        $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
        $s->execute([$orderId]);
        $order = $s->fetch();
        if (!$order) return;
        $s2 = $pdo->prepare("SELECT * FROM order_items WHERE order_id=?");
        $s2->execute([$orderId]);
        $items = $s2->fetchAll();
        send_email_notification($pdo, $order, $items);
        send_customer_order_email($order, $items);
        send_whatsapp_notification($pdo, $order, $items);
    } catch (Exception $e) { /* silent — never break the order flow */ }
}

// ── Payment helpers ───────────────────────────────────────────
function pay_settings($pdo) {
    $rows = $pdo->query("SELECT `key`,`value` FROM payment_settings")->fetchAll();
    $m = [];
    foreach ($rows as $r) $m[$r['key']] = $r['value'];
    return $m;
}

function stripe_curl($pdo, $endpoint, $data = [], $httpMethod = 'POST') {
    $cfg = pay_settings($pdo);
    $key = $cfg['stripe_secret_key'] ?? '';
    if (!$key) return ['data'=>null,'status'=>500,'error'=>'Stripe not configured'];
    $ch = curl_init('https://api.stripe.com/v1/' . $endpoint);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $httpMethod,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ];
    if ($httpMethod !== 'GET' && !empty($data))
        $opts[CURLOPT_POSTFIELDS] = http_build_query($data);
    curl_setopt_array($ch, $opts);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $decoded = json_decode($res, true);
    return ['data' => $decoded, 'status' => $code,
            'error' => ($decoded['error']['message'] ?? null)];
}

// Get (or lazily create) the Stripe Customer backing a user's recurring
// subscriptions, persisting the id on their profile so it's reused.
function stripe_get_or_create_customer($pdo, $u) {
    $s = $pdo->prepare('SELECT stripe_customer_id, name FROM profiles WHERE id=?');
    $s->execute([$u['id']]);
    $profile = $s->fetch();
    if ($profile && $profile['stripe_customer_id']) return $profile['stripe_customer_id'];

    $res = stripe_curl($pdo, 'customers', [
        'email'            => $u['email'] ?? '',
        'name'             => $profile['name'] ?? '',
        'metadata[user_id]'=> $u['id'],
    ]);
    if ($res['error'] || empty($res['data']['id'])) return null;
    $pdo->prepare('UPDATE profiles SET stripe_customer_id=? WHERE id=?')->execute([$res['data']['id'], $u['id']]);
    return $res['data']['id'];
}

// ── VoIP.ms REST call via cURL (allow_url_fopen is often disabled on shared hosts) ─
// $timeout defaults to a short window for quick lookup-style calls
// (getSubAccounts, getCDR, sendSMS, ...). Pass a longer one explicitly only for
// calls known to be slow on VoIP.ms's side (createSubAccount, setSubAccount) —
// chaining several long-timeout calls in one request risks exceeding the
// host's own script/gateway time limit, which kills PHP with an empty
// response before it can report anything back to the browser.
function voipms_call($apiUser, $apiPass, $method, array $params = [], int $timeout = 10) {
    $url = 'https://voip.ms/api/v1/rest.php?' . http_build_query(array_merge($params, [
        'api_username' => $apiUser,
        'api_password' => $apiPass,
        'method'       => $method,
    ]));
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $raw = curl_exec($ch);
    curl_close($ch);
    if ($raw === false) return null;
    return json_decode($raw, true);
}

// Map common VoIP.ms error statuses to an actionable hint for the admin
function voipms_error_hint($status) {
    switch ($status) {
        case 'ip_not_enabled':
            return ' — your server IP is not whitelisted. Log in to voip.ms → Main Menu → API → add this server\'s IP to "Allowed IPs".';
        case 'invalid_credentials':
        case 'missing_credentials':
            return ' — check the API username/password saved in Admin → VoIP → Provider Setup (the API password is NOT your voip.ms login password).';
        case 'api_not_enabled':
            return ' — enable the API at voip.ms → Main Menu → API.';
        default:
            return '';
    }
}

// Look up the real cost VoIP.ms billed for a call via getCDR, matching by
// number + start time (within a small tolerance). Returns null if no match
// (e.g. CDR hasn't posted yet), so callers can fall back to a rate estimate.
function voipms_get_call_cost($apiUser, $apiPass, $fromNumber, $toNumber, $startedAt) {
    $day = date('Y-m-d', strtotime($startedAt));
    $resp = voipms_call($apiUser, $apiPass, 'getCDR', [
        'date_from' => $day, 'date_to' => $day, 'timezone' => '0',
    ]);
    if (!$resp || ($resp['status'] ?? '') !== 'success' || empty($resp['cdr'])) return null;
    $targetTs = strtotime($startedAt);
    $best = null; $bestDiff = null;
    foreach ($resp['cdr'] as $row) {
        $src = preg_replace('/\D/', '', $row['source'] ?? '');
        $dst = preg_replace('/\D/', '', $row['destination'] ?? '');
        $fn  = preg_replace('/\D/', '', $fromNumber ?? '');
        $tn  = preg_replace('/\D/', '', $toNumber ?? '');
        $matchesNumbers = ($fn && (strpos($src, substr($fn, -7)) !== false || strpos($dst, substr($fn, -7)) !== false))
            || ($tn && (strpos($src, substr($tn, -7)) !== false || strpos($dst, substr($tn, -7)) !== false));
        if (!$matchesNumbers) continue;
        $rowTs = strtotime($row['date'] ?? '');
        if (!$rowTs) continue;
        $diff = abs($rowTs - $targetTs);
        if ($diff > 300) continue; // must be within 5 minutes of our recorded start
        if ($bestDiff === null || $diff < $bestDiff) { $bestDiff = $diff; $best = $row; }
    }
    return $best ? (float)($best['total'] ?? 0) : null;
}

function make_order_id() {
    return 'ORD-' . strtoupper(substr(bin2hex(random_bytes(6)), 0, 10));
}

// ── Parse request ─────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = preg_replace('#^/api#', '', $uri); // strip /api prefix
$segs   = array_values(array_filter(explode('/', trim($uri, '/'))));
$r0 = $segs[0] ?? '';
$r1 = $segs[1] ?? null;
$r2 = $segs[2] ?? null;

// ── Routes ────────────────────────────────────────────────────
switch ($r0) {

// ═══ HEALTH ═══════════════════════════════════════════════════════
case 'health':
    send([
        'status'        => 'ok',
        'db'            => 'connected',
        'config_file'   => isset($__configFoundAt) && $__configFoundAt !== null ? 'found' : 'using fallback values',
        'found_at_path' => isset($__configFoundAt) && $__configFoundAt !== null
            ? ($__configCheckedAt[$__configFoundAt - 1]['path'] ?? null)
            : null,
        'checked_paths' => $__configCheckedAt ?? [],
    ]);
    break;

// ═══ AUTH ═══════════════════════════════════════════════════════
case 'auth':
    switch ($r1) {

    case 'login':
        if ($method !== 'POST') err('Method not allowed', 405);
        $b = body();
        $email = trim($b['email'] ?? '');
        $pass  = $b['password'] ?? '';
        if (!$email || !$pass) err('Email and password required');

        // Rate limit: max 5 failed attempts per email+IP in 15 minutes
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        try {
            $rl = $pdo->prepare('SELECT COUNT(*) c FROM login_attempts WHERE email=? AND ip=? AND attempted_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)');
            $rl->execute([$email, $ip]);
            if ((int)$rl->fetch()['c'] >= 5) err('Too many failed attempts. Try again in 15 minutes.', 429);
        } catch (Exception $e) { /* table missing — skip rate limiting rather than block logins */ }

        $s = $pdo->prepare('SELECT * FROM users WHERE email = ?');
        $s->execute([$email]);
        $u = $s->fetch();
        if (!$u || !password_verify($pass, $u['password_hash'])) {
            try { $pdo->prepare('INSERT INTO login_attempts (email, ip) VALUES (?,?)')->execute([$email, $ip]); } catch (Exception $e) {}
            err('Invalid credentials', 401);
        }
        // Suspended accounts cannot log in
        $sp = $pdo->prepare('SELECT status FROM profiles WHERE id=?');
        $sp->execute([$u['id']]);
        if (($sp->fetch()['status'] ?? 'active') === 'suspended') err('Account suspended. Contact support.', 403);
        // Success: clear this user's failed attempts and purge expired sessions
        try {
            $pdo->prepare('DELETE FROM login_attempts WHERE email=?')->execute([$email]);
            $pdo->exec('DELETE FROM sessions WHERE expires_at < NOW()');
        } catch (Exception $e) {}
        // Create token
        $tok     = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+7 days'));
        $pdo->prepare('INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)')->execute([$tok, $u['id'], $expires]);
        // Get profile
        $ps = $pdo->prepare('SELECT * FROM profiles WHERE id = ?');
        $ps->execute([$u['id']]);
        $profile = $ps->fetch() ?: [];
        send([
            'token' => $tok,
            'user'  => [
                'id'    => $u['id'],
                'email' => $u['email'],
                'role'  => $u['role'],
                'name'  => $profile['name'] ?? '',
                'phone' => $profile['phone'] ?? '',
                'plan'  => $profile['plan'] ?? 'basic',
                'user_metadata' => ['role' => $u['role']],
            ],
        ]);
        break;

    case 'signup':
        if ($method !== 'POST') err('Method not allowed', 405);
        $b     = body();
        $email = trim($b['email'] ?? '');
        $pass  = $b['password'] ?? '';
        $meta  = $b['metadata'] ?? [];
        if (!$email || !$pass) err('Email and password required');
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email address');
        if (strlen($pass) < 6) err('Password must be at least 6 characters');
        // Check duplicate
        $ck = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $ck->execute([$email]);
        if ($ck->fetch()) err('Email already registered', 409);
        $id      = bin2hex(random_bytes(18));
        $hash    = password_hash($pass, PASSWORD_BCRYPT);
        $vTok    = bin2hex(random_bytes(32));
        $pdo->prepare('INSERT INTO users (id,email,password_hash,role,email_verify_token) VALUES (?,?,?,?,?)')->execute([$id,$email,$hash,'user',$vTok]);
        $uname = $meta['name'] ?? '';
        $pdo->prepare('INSERT INTO profiles (id,email,name,phone,plan,role) VALUES (?,?,?,?,?,?)')->execute([
            $id,$email,$uname,$meta['phone']??'',$meta['plan']??'basic','user',
        ]);
        $verifyUrl = SITE_URL . '/verify-email?token=' . $vTok;
        $uplan = $meta['plan'] ?? 'basic';
        // Non-blocking emails — never abort signup on failure
        trigger_welcome_email($email, $uname);
        trigger_new_user_admin($email, $uname, $uplan);
        try {
            sendMail($email, $uname ?: 'User', 'Verify Your Email — Oasis Orchard Technologies',
                     emailVerificationHtml($uname ?: 'User', $verifyUrl));
        } catch (Throwable $e) { error_log('[Signup] Verification email failed: ' . $e->getMessage()); }
        send(['user' => ['id'=>$id,'email'=>$email,'role'=>'user']], 201);
        break;

    case 'logout':
        if ($method !== 'POST') err('Method not allowed', 405);
        $t = token();
        if ($t) $pdo->prepare('DELETE FROM sessions WHERE token=?')->execute([$t]);
        send(['message' => 'Logged out']);
        break;

    case 'change-password':
        if ($method !== 'POST') err('Method not allowed', 405);
        $u = authUser($pdo);
        $b = body();
        $current = $b['current'] ?? '';
        $new     = $b['new'] ?? '';
        if (!$current || !$new) err('Current and new password required');
        if (strlen($new) < 6) err('New password must be at least 6 characters');
        $s = $pdo->prepare('SELECT password_hash FROM users WHERE id=?');
        $s->execute([$u['id']]);
        $row = $s->fetch();
        if (!$row || !password_verify($current, $row['password_hash'])) err('Current password is incorrect', 401);
        $pdo->prepare('UPDATE users SET password_hash=? WHERE id=?')->execute([password_hash($new, PASSWORD_BCRYPT), $u['id']]);
        // Revoke all other sessions — anyone else logged in with the old password is kicked out
        $t = token();
        $pdo->prepare('DELETE FROM sessions WHERE user_id=? AND token<>?')->execute([$u['id'], $t]);
        send(['changed' => true]);
        break;

    case 'send-verification':
        // Resend / send email verification link to logged-in user
        if ($method !== 'POST') err('Method not allowed', 405);
        $u = authUser($pdo);
        $tok = bin2hex(random_bytes(32));
        $pdo->prepare('UPDATE users SET email_verify_token=? WHERE id=?')->execute([$tok, $u['id']]);
        $url = SITE_URL . '/verify-email?token=' . $tok;
        $p2  = $pdo->prepare('SELECT name FROM profiles WHERE id=?');
        $p2->execute([$u['id']]);
        $uname = $p2->fetch()['name'] ?? 'User';
        $sent = sendMail($u['email'], $uname, 'Verify Your Email — Oasis Orchard Technologies', emailVerificationHtml($uname, $url));
        send(['sent' => $sent]);
        break;

    case 'verify-email':
        // GET /api/auth/verify-email?token=xxx
        if ($method !== 'GET') err('Method not allowed', 405);
        $tok = $_GET['token'] ?? '';
        if (!$tok) err('Token required');
        $s = $pdo->prepare('SELECT id FROM users WHERE email_verify_token=?');
        $s->execute([$tok]);
        $row = $s->fetch();
        if (!$row) err('Invalid or expired token', 404);
        $pdo->prepare('UPDATE users SET email_verified=1, email_verify_token=NULL WHERE id=?')->execute([$row['id']]);
        send(['verified' => true]);
        break;

    case 'forgot-password':
        if ($method !== 'POST') err('Method not allowed', 405);
        $b     = body();
        $email = trim($b['email'] ?? '');
        if (!$email) err('Email required');
        // Always return success to avoid user enumeration
        $s = $pdo->prepare('SELECT u.id, p.name FROM users u LEFT JOIN profiles p ON p.id=u.id WHERE u.email=?');
        $s->execute([$email]);
        $row = $s->fetch();
        if ($row) {
            $tok     = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $pdo->prepare('UPDATE users SET reset_token=?, reset_token_expires=? WHERE id=?')
                ->execute([$tok, $expires, $row['id']]);
            $url = SITE_URL . '/reset-password?token=' . $tok;
            sendMail($email, $row['name'] ?? 'User', 'Reset Your Password — Oasis Orchard Technologies',
                     passwordResetHtml($row['name'] ?? 'User', $url));
        }
        send(['message' => 'If that email exists, a reset link has been sent.']);
        break;

    case 'reset-password':
        if ($method !== 'POST') err('Method not allowed', 405);
        $b    = body();
        $tok  = $b['token']    ?? '';
        $pass = $b['password'] ?? '';
        if (!$tok || !$pass) err('Token and password required');
        if (strlen($pass) < 6) err('Password must be at least 6 characters');
        $s = $pdo->prepare('SELECT id FROM users WHERE reset_token=? AND reset_token_expires > NOW()');
        $s->execute([$tok]);
        $row = $s->fetch();
        if (!$row) err('Invalid or expired reset link', 400);
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $pdo->prepare('UPDATE users SET password_hash=?, reset_token=NULL, reset_token_expires=NULL WHERE id=?')
            ->execute([$hash, $row['id']]);
        // Revoke all sessions so attacker sessions are terminated
        $pdo->prepare('DELETE FROM sessions WHERE user_id=?')->execute([$row['id']]);
        send(['reset' => true]);
        break;

    case 'me':
        if ($method !== 'GET') err('Method not allowed', 405);
        $u = authUser($pdo);
        $ps = $pdo->prepare('SELECT * FROM profiles WHERE id = ?');
        $ps->execute([$u['id']]);
        $p = $ps->fetch() ?: [];
        send(['user' => [
            'id'            => $u['id'],
            'email'         => $u['email'],
            'role'          => $u['role'],
            'name'          => $p['name'] ?? '',
            'phone'         => $p['phone'] ?? '',
            'address'       => $p['address'] ?? '',
            'plan'          => $p['plan'] ?? 'basic',
            'walletBalance' => (float)($p['wallet_balance'] ?? 0),
            'status'        => $p['status'] ?? 'active',
            'user_metadata' => ['role' => $u['role']],
        ]]);
        break;

    default: err('Not found', 404);
    }
    break;

// ═══ PROFILES ═══════════════════════════════════════════════════
case 'profiles':
    $uid = $r1;
    if (!$uid) err('User ID required', 400);
    if ($method === 'GET') {
        $u = authUser($pdo);
        if ($u['id'] !== $uid && $u['role'] !== 'admin') err('Forbidden', 403);
        $s = $pdo->prepare('SELECT * FROM profiles WHERE id = ?');
        $s->execute([$uid]);
        $p = $s->fetch();
        if (!$p) err('Not found', 404);
        send($p);
    } elseif ($method === 'PUT') {
        $u = authUser($pdo);
        if ($u['id'] !== $uid && $u['role'] !== 'admin') err('Forbidden', 403);
        $b = body();
        if ($u['role'] === 'admin') {
            $pdo->prepare('UPDATE profiles SET name=?,phone=?,address=?,plan=?,status=?,wallet_balance=? WHERE id=?')->execute([
                $b['name'] ?? '', $b['phone'] ?? '', $b['address'] ?? '',
                $b['plan'] ?? 'basic', $b['status'] ?? 'active',
                (float)($b['wallet_balance'] ?? 0), $uid,
            ]);
        } else {
            // Regular users may only edit their own contact info —
            // never plan, status, or wallet_balance (privilege escalation)
            $pdo->prepare('UPDATE profiles SET name=?,phone=?,address=? WHERE id=?')->execute([
                $b['name'] ?? '', $b['phone'] ?? '', $b['address'] ?? '', $uid,
            ]);
        }
        $s = $pdo->prepare('SELECT * FROM profiles WHERE id = ?');
        $s->execute([$uid]);
        send($s->fetch());
    }
    break;

// ═══ PRODUCTS ═══════════════════════════════════════════════════
case 'products':
    if ($r1 === null) {
        // GET /products  or  POST /products
        if ($method === 'GET') {
            $all = isset($_GET['all']);
            if ($all) authUser($pdo, true);
            $sql  = $all ? 'SELECT * FROM products ORDER BY created_at DESC'
                         : 'SELECT * FROM products WHERE is_active=1 ORDER BY created_at DESC';
            $rows = $pdo->query($sql)->fetchAll();
            send(array_map('productRow', $rows));
        } elseif ($method === 'POST') {
            authUser($pdo, true);
            $b  = body();
            $id = 'prod-' . time() . '-' . rand(100,999);
            $pdo->prepare('INSERT INTO products (id,name,sku,category,price,original_price,on_sale,stock,rating,review_count,image_url,badge,short_desc,specs,features,is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)')->execute([
                $id, $b['name']??'', $b['sku']??'', $b['category']??'',
                (float)($b['price']??0), (float)($b['original_price']??$b['price']??0),
                (int)($b['on_sale']??0), (int)($b['stock']??0),
                (float)($b['rating']??0), (int)($b['review_count']??0),
                $b['image_url']??'', $b['badge']??'', $b['short_desc']??'',
                json_encode($b['specs']??[]), json_encode($b['features']??[]),
            ]);
            $s = $pdo->prepare('SELECT * FROM products WHERE id=?');
            $s->execute([$id]);
            send(productRow($s->fetch()), 201);
        } else err('Method not allowed', 405);

    } elseif ($r2 === 'toggle') {
        // PATCH /products/:id/toggle
        authUser($pdo, true);
        $s = $pdo->prepare('SELECT is_active FROM products WHERE id=?');
        $s->execute([$r1]);
        $p = $s->fetch();
        if (!$p) err('Not found', 404);
        $new = $p['is_active'] ? 0 : 1;
        $pdo->prepare('UPDATE products SET is_active=? WHERE id=?')->execute([$new,$r1]);
        send(['id'=>$r1,'is_active'=>(bool)$new]);

    } elseif ($method === 'PUT') {
        authUser($pdo, true);
        $b = body();
        $pdo->prepare('UPDATE products SET name=?,sku=?,category=?,price=?,original_price=?,on_sale=?,stock=?,rating=?,review_count=?,image_url=?,badge=?,short_desc=?,specs=?,features=?,is_active=? WHERE id=?')->execute([
            $b['name']??'', $b['sku']??'', $b['category']??'',
            (float)($b['price']??0), (float)($b['original_price']??$b['price']??0),
            (int)($b['on_sale']??0), (int)($b['stock']??0),
            (float)($b['rating']??0), (int)($b['review_count']??0),
            $b['image_url']??'', $b['badge']??'', $b['short_desc']??'',
            json_encode($b['specs']??[]), json_encode($b['features']??[]),
            (int)($b['is_active']??1), $r1,
        ]);
        $s = $pdo->prepare('SELECT * FROM products WHERE id=?');
        $s->execute([$r1]);
        $row = $s->fetch();
        if (!$row) err('Not found', 404);
        send(productRow($row));

    } elseif ($method === 'DELETE') {
        authUser($pdo, true);
        $pdo->prepare('DELETE FROM products WHERE id=?')->execute([$r1]);
        send(['message' => 'Deleted']);
    } else err('Method not allowed', 405);
    break;

// ═══ CONTENT / SETTINGS ═════════════════════════════════════════
case 'content':
    $key = $r1;
    if (!$key) {
        // GET /api/content?keys=a,b,c — fetch many keys in ONE request (public)
        if ($method === 'GET' && isset($_GET['keys'])) {
            $keys = array_values(array_filter(array_map('trim', explode(',', $_GET['keys']))));
            if (count($keys) === 0 || count($keys) > 50) send((object)[]);
            $ph = implode(',', array_fill(0, count($keys), '?'));
            $s = $pdo->prepare("SELECT section_key, content FROM page_content WHERE section_key IN ($ph)");
            $s->execute($keys);
            $map = [];
            foreach ($s->fetchAll() as $r) $map[$r['section_key']] = json_decode($r['content'], true);
            send($map);
        }
        // GET /api/content?prefix=custom_page_  — list rows by prefix (admin)
        if ($method === 'GET' && isset($_GET['prefix'])) {
            authUser($pdo, true);
            $prefix = $_GET['prefix'] . '%';
            $s = $pdo->prepare('SELECT section_key, content FROM page_content WHERE section_key LIKE ?');
            $s->execute([$prefix]);
            $rows = array_map(fn($r) => ['section_key'=>$r['section_key'],'content'=>json_decode($r['content'],true)], $s->fetchAll());
            send($rows);
        } else { err('Key required', 400); }
        break;
    }
    if ($method === 'GET') {
        $s = $pdo->prepare('SELECT content FROM page_content WHERE section_key=?');
        $s->execute([$key]);
        $row = $s->fetch();
        send($row ? json_decode($row['content'], true) : null);
    } elseif ($method === 'PUT') {
        authUser($pdo, true);
        $b   = body();
        $val = json_encode(isset($b['content']) ? $b['content'] : $b);
        $pdo->prepare('INSERT INTO page_content (section_key,content) VALUES (?,?) ON DUPLICATE KEY UPDATE content=VALUES(content)')->execute([$key,$val]);
        send(['message' => 'Saved']);
    } elseif ($method === 'DELETE') {
        authUser($pdo, true);
        $pdo->prepare('DELETE FROM page_content WHERE section_key=?')->execute([$key]);
        send(['deleted' => true]);
    } else err('Method not allowed', 405);
    break;

// ═══ USERS (admin) ═══════════════════════════════════════════════
case 'users':
    authUser($pdo, true);
    if ($r1 === null) {
        if ($method === 'GET') {
            $rows = $pdo->query('SELECT * FROM profiles ORDER BY created_at DESC')->fetchAll();
            send($rows);
        } elseif ($method === 'POST') {
            $b     = body();
            $email = trim($b['email'] ?? '');
            $pass  = $b['password'] ?? '';
            $name  = trim($b['name'] ?? '');
            $plan  = $b['plan'] ?? 'basic';
            if (!$email || !$pass) err('Email and password required');
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) err('Invalid email address');
            if (strlen($pass) < 6) err('Password must be at least 6 characters');
            $ck = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $ck->execute([$email]);
            if ($ck->fetch()) err('Email already registered', 409);
            $id   = bin2hex(random_bytes(18));
            $hash = password_hash($pass, PASSWORD_BCRYPT);
            $pdo->prepare('INSERT INTO users (id,email,password_hash,role) VALUES (?,?,?,?)')->execute([$id,$email,$hash,'user']);
            $pdo->prepare('INSERT INTO profiles (id,email,name,plan,role) VALUES (?,?,?,?,?)')->execute([$id,$email,$name,$plan,'user']);
            $s = $pdo->prepare('SELECT * FROM profiles WHERE id=?');
            $s->execute([$id]);
            send($s->fetch(), 201);
        } else {
            err('Method not allowed', 405);
        }
    } elseif ($method === 'PUT') {
        $b = body();
        $pdo->prepare('UPDATE profiles SET name=?,phone=?,address=?,plan=?,status=?,wallet_balance=? WHERE id=?')->execute([
            $b['name']??'',$b['phone']??'',$b['address']??'',$b['plan']??'basic',
            $b['status']??'active',(float)($b['wallet_balance']??0),$r1,
        ]);
        // Suspending a user revokes their active sessions immediately
        if (($b['status'] ?? '') === 'suspended') {
            $pdo->prepare('DELETE FROM sessions WHERE user_id=?')->execute([$r1]);
        }
        $s = $pdo->prepare('SELECT * FROM profiles WHERE id=?');
        $s->execute([$r1]);
        send($s->fetch());
    } elseif ($method === 'DELETE') {
        $pdo->prepare('DELETE FROM users WHERE id=?')->execute([$r1]);
        send(['message' => 'Deleted']);
    } else err('Method not allowed', 405);
    break;

// ═══ WALLET ══════════════════════════════════════════════════════
case 'wallet':

    // POST /wallet/credit — admin credits a user
    if ($r1 === 'credit') {
        authUser($pdo, true);
        $b   = body();
        $uid = $b['user_id'] ?? '';
        $amt = (float)($b['amount'] ?? 0);
        $note = $b['description'] ?? 'Admin credit';
        if (!$uid || $amt <= 0) err('Invalid request');
        $s = $pdo->prepare('SELECT wallet_balance FROM profiles WHERE id=?');
        $s->execute([$uid]);
        $p = $s->fetch();
        if (!$p) err('User not found', 404);
        $newBal = (float)$p['wallet_balance'] + $amt;
        $pdo->prepare('UPDATE profiles SET wallet_balance=? WHERE id=?')->execute([$newBal,$uid]);
        $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')->execute([$uid,$note,$amt,'credit',$newBal]);
        send(['new_balance'=>$newBal, 'transaction' => ['description'=>$note,'amount'=>$amt,'type'=>'credit','balance_after'=>$newBal,'created_at'=>date('c')]]);
    }

    // POST /wallet/topup/stripe — create a Stripe PaymentIntent for wallet top-up
    elseif ($r1 === 'topup' && $r2 === 'stripe') {
        if ($method !== 'POST') err('Method not allowed', 405);
        $u   = authUser($pdo);
        $b   = body();
        $cfg = pay_settings($pdo);
        if (($cfg['stripe_enabled'] ?? 'false') !== 'true') err('Stripe is not enabled', 400);
        $amount = (int)(round((float)($b['amount'] ?? 0), 2) * 100); // cents
        if ($amount < 100) err('Minimum top-up is $1.00');
        $currency = strtolower($cfg['currency'] ?? 'cad');
        $res = stripe_curl($pdo, 'payment_intents', [
            'amount'                             => $amount,
            'currency'                           => $currency,
            'payment_method_types[0]'            => 'card',
            'metadata[user_id]'                  => $u['id'],
            'metadata[purpose]'                  => 'wallet_topup',
        ]);
        if ($res['error']) err('Stripe error: ' . $res['error'], 502);
        send([
            'clientSecret' => $res['data']['client_secret'],
            'intentId'     => $res['data']['id'],
        ]);
    }

    // POST /wallet/topup/confirm — verify Stripe payment and credit wallet
    elseif ($r1 === 'topup' && $r2 === 'confirm') {
        if ($method !== 'POST') err('Method not allowed', 405);
        $u          = authUser($pdo);
        $b          = body();
        $intentId   = trim($b['intent_id'] ?? '');
        if (!$intentId) err('intent_id required');

        // Retrieve PaymentIntent from Stripe to verify
        $res = stripe_curl($pdo, 'payment_intents/' . $intentId, [], 'GET');
        if ($res['error'] || ($res['status'] ?? 0) !== 200) err('Could not verify payment', 502);
        $pi = $res['data'];

        if (($pi['status'] ?? '') !== 'succeeded') err('Payment not completed');
        if (($pi['metadata']['purpose'] ?? '') !== 'wallet_topup') err('Invalid payment purpose');
        if (($pi['metadata']['user_id'] ?? '') !== $u['id']) err('Payment user mismatch', 403);

        // Idempotency: check if already credited
        $chk = $pdo->prepare("SELECT id FROM wallet_transactions WHERE description LIKE ?");
        $chk->execute(['%' . $intentId . '%']);
        if ($chk->fetch()) err('This payment has already been applied', 409);

        $amountDollars = $pi['amount'] / 100;
        $s = $pdo->prepare('SELECT wallet_balance FROM profiles WHERE id=?');
        $s->execute([$u['id']]);
        $profile = $s->fetch();
        if (!$profile) err('User not found', 404);
        $newBal = (float)$profile['wallet_balance'] + $amountDollars;
        $note   = 'Wallet top-up via card (Stripe: ' . $intentId . ')';
        $pdo->prepare('UPDATE profiles SET wallet_balance=? WHERE id=?')->execute([$newBal, $u['id']]);
        $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')
            ->execute([$u['id'], $note, $amountDollars, 'credit', $newBal]);
        send(['new_balance' => $newBal, 'amount' => $amountDollars]);
    }

    // GET /wallet/:uid — transaction history
    else {
        $u = authUser($pdo);
        $uid = $r1 ?? $u['id'];
        if ($uid !== $u['id'] && $u['role'] !== 'admin') err('Forbidden',403);
        $s = $pdo->prepare('SELECT * FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC');
        $s->execute([$uid]);
        send($s->fetchAll());
    }
    break;

// ═══ PLAN ════════════════════════════════════════════════════════
case 'plan':
    // POST /plan/cancel — user cancels their own active plan. Only ever
    // moves a user's plan to 'none' for themselves, so it can't be used
    // to self-upgrade (that still requires payment, see /payments/stripe).
    if ($r1 === 'cancel') {
        if ($method !== 'POST') err('Method not allowed', 405);
        $u = authUser($pdo);
        $s = $pdo->prepare('SELECT plan, stripe_subscription_id FROM profiles WHERE id=?');
        $s->execute([$u['id']]);
        $current = $s->fetch();
        if (!$current || $current['plan'] === 'none') err('No active plan to cancel', 400);
        // Cancel the recurring Stripe subscription too, so the card isn't
        // charged again next cycle — errors here are logged, not fatal, so
        // the user can still cancel locally even if Stripe is unreachable.
        if (!empty($current['stripe_subscription_id'])) {
            stripe_curl($pdo, 'subscriptions/' . $current['stripe_subscription_id'], [], 'DELETE');
        }
        $pdo->prepare("UPDATE profiles SET plan='none', stripe_subscription_id=NULL WHERE id=?")->execute([$u['id']]);
        $s->execute([$u['id']]);
        send($s->fetch());

    // POST /plan/upgrade — pay for a plan out of the user's own wallet
    // balance. Price is authoritative server-side, balance is checked and
    // deducted atomically here (never trust a client-supplied amount/plan
    // state for something that grants paid service).
    } elseif ($r1 === 'upgrade') {
        if ($method !== 'POST') err('Method not allowed', 405);
        $u = authUser($pdo);
        $b = body();
        $planId = $b['plan_id'] ?? '';
        $planPrices = ['basic' => 10.00, 'smart' => 15.00, 'business' => 25.00];
        if (!isset($planPrices[$planId])) err('Unknown plan', 400);
        $price = $planPrices[$planId];

        $s = $pdo->prepare('SELECT plan, wallet_balance, stripe_subscription_id FROM profiles WHERE id=?');
        $s->execute([$u['id']]);
        $profile = $s->fetch();
        if (!$profile) err('User not found', 404);
        if ($profile['plan'] === $planId) err('You are already on this plan', 400);
        if ((float)$profile['wallet_balance'] < $price) err('Insufficient wallet balance', 400);

        // Paying with the wallet is a one-off manual payment, not recurring —
        // cancel any existing Stripe subscription so the card isn't also
        // auto-charged for the old plan next cycle.
        if (!empty($profile['stripe_subscription_id'])) {
            stripe_curl($pdo, 'subscriptions/' . $profile['stripe_subscription_id'], [], 'DELETE');
        }

        $newBal = (float)$profile['wallet_balance'] - $price;
        $verb   = ($profile['plan'] === 'none' || !$profile['plan']) ? 'Subscription' : 'Upgrade';
        $pdo->prepare('UPDATE profiles SET wallet_balance=?, plan=?, stripe_subscription_id=NULL WHERE id=?')->execute([$newBal, $planId, $u['id']]);
        $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')
            ->execute([$u['id'], "$verb to plan: $planId", $price, 'debit', $newBal]);

        $s->execute([$u['id']]);
        send($s->fetch());

    } else err('Not found', 404);
    break;

// ═══ PHONE CALLS ═════════════════════════════════════════════════
case 'voip':
    $u = authUser($pdo);
    switch ($r1) {
    case 'account':
        if ($method === 'GET') {
            $s = $pdo->prepare('SELECT * FROM voip_accounts WHERE user_id=?');
            $s->execute([$u['id']]);
            $acc = $s->fetch();
            if (!$acc) {
                $pdo->prepare('INSERT INTO voip_accounts (user_id,voip_credits) VALUES (?,0)')->execute([$u['id']]);
                $s->execute([$u['id']]);
                $acc = $s->fetch();
            }
            send($acc);
        } elseif ($method === 'PATCH') {
            $b = body();
            $pdo->prepare('UPDATE voip_accounts SET voip_credits=? WHERE user_id=?')->execute([(float)($b['voip_credits']??0),$u['id']]);
            send(['updated'=>true]);
        }
        break;
    case 'accounts': // admin: list/update all accounts
        authUser($pdo, true);
        if ($method === 'GET') {
            $s = $pdo->query('SELECT va.*, p.name, p.email, p.plan FROM voip_accounts va LEFT JOIN profiles p ON p.user_id=va.user_id');
            send($s->fetchAll());
        } elseif ($method === 'PATCH' && $r2) {
            $b = body();
            $pdo->prepare('UPDATE voip_accounts SET phone_number=?,voip_credits=?,voip_enabled=? WHERE id=?')->execute([
                $b['phone_number']??null, (float)($b['voip_credits']??0), (int)($b['voip_enabled']??1), $r2,
            ]);
            send(['updated'=>true]);
        }
        break;
    case 'calls':
        if ($method === 'GET') {
            if (isset($_GET['all'])) {
                authUser($pdo, true);
                $s = $pdo->query("SELECT vc.*, p.name AS user_name, p.email AS user_email FROM voip_calls vc LEFT JOIN profiles p ON p.user_id=vc.user_id WHERE vc.direction!='internal' ORDER BY vc.started_at DESC LIMIT 200");
                send($s->fetchAll());
            } else {
                $s = $pdo->prepare('SELECT * FROM voip_calls WHERE user_id=? ORDER BY started_at DESC LIMIT 100');
                $s->execute([$u['id']]);
                send($s->fetchAll());
            }
        } elseif ($method === 'POST') {
            $b = body();
            $pdo->prepare('INSERT INTO voip_calls (user_id,direction,from_number,to_number,status) VALUES (?,?,?,?,?)')->execute([
                $u['id'], $b['direction']??'outbound', $b['from_number']??'', $b['to_number']??'', 'initiated',
            ]);
            $id = $pdo->lastInsertId();
            $s  = $pdo->prepare('SELECT * FROM voip_calls WHERE id=?');
            $s->execute([$id]);
            send($s->fetch(), 201);
        } elseif ($method === 'PATCH' && $r2) {
            $b = body();
            $s = $pdo->prepare('SELECT * FROM voip_calls WHERE id=? AND user_id=?');
            $s->execute([$r2, $u['id']]);
            $call = $s->fetch();
            if (!$call) err('Call not found', 404);

            $status  = $b['status'] ?? 'ended';
            $seconds = (int)($b['duration_seconds'] ?? 0);
            $cost    = 0.0;

            // Bill the wallet only once, when the call actually ends with a
            // real duration. Cost is computed server-side (never trust the
            // client) using VoIP.ms's real CDR cost, falling back to the
            // configured per-minute rate if the CDR hasn't posted yet.
            if ($status !== 'initiated' && $status !== 'ringing' && $seconds > 0 && (float)$call['cost'] === 0.0) {
                $rows = $pdo->query("SELECT `key`,`value` FROM voip_settings WHERE `key` IN ('voipms_api_user','voipms_api_pass','provider_config')")->fetchAll();
                $cfg = [];
                foreach ($rows as $row) $cfg[$row['key']] = json_decode($row['value'], true);
                $rate = (float)($cfg['provider_config']['ratePerMinute'] ?? 0.014);

                $cost = null;
                if (!empty($cfg['voipms_api_user']) && !empty($cfg['voipms_api_pass'])) {
                    $cost = voipms_get_call_cost(
                        $cfg['voipms_api_user'], $cfg['voipms_api_pass'],
                        $call['from_number'], $call['to_number'], $call['started_at']
                    );
                }
                if ($cost === null) $cost = round((ceil($seconds / 60)) * $rate, 4);

                if ($cost > 0) {
                    $p = $pdo->prepare('SELECT wallet_balance FROM profiles WHERE id=?');
                    $p->execute([$u['id']]);
                    $profile = $p->fetch();
                    $newBal = max(0, (float)($profile['wallet_balance'] ?? 0) - $cost);
                    $pdo->prepare('UPDATE profiles SET wallet_balance=? WHERE id=?')->execute([$newBal, $u['id']]);
                    $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')
                        ->execute([$u['id'], "Call charge: {$call['to_number']} ({$seconds}s)", $cost, 'debit', $newBal]);
                }
            }

            $pdo->prepare('UPDATE voip_calls SET status=?,duration_seconds=?,cost=?,ended_at=? WHERE id=? AND user_id=?')->execute([
                $status, $seconds, $cost, $b['ended_at']??null, $r2, $u['id'],
            ]);
            send(['updated'=>true, 'cost'=>$cost]);
        }
        break;
    case 'settings':
        if ($method === 'GET') {
            $rows = $pdo->query("SELECT `key`, `value` FROM voip_settings")->fetchAll();
            $map  = [];
            foreach ($rows as $r) $map[$r['key']] = json_decode($r['value'], true);
            // Non-admins only get what the dashboard needs — never API credentials
            if (($u['role'] ?? '') !== 'admin') {
                $safe = [];
                if (isset($map['provider_config']) && is_array($map['provider_config'])) {
                    $pc = $map['provider_config'];
                    foreach (array_keys($pc) as $k) {
                        if (preg_match('/pass|secret|token/i', $k)) unset($pc[$k]);
                    }
                    $safe['provider_config'] = $pc;
                }
                if (isset($map['voip_enabled'])) $safe['voip_enabled'] = $map['voip_enabled'];
                $map = $safe;
            }
            send($map);
        } elseif ($method === 'PUT') {
            authUser($pdo, true);
            $b = body(); // expects { key: value, key2: value2, ... }
            foreach ($b as $k => $v) {
                $pdo->prepare("INSERT INTO voip_settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)")
                    ->execute([preg_replace('/[^a-zA-Z0-9_]/', '', $k), json_encode($v)]);
            }
            send(['saved' => true]);
        }
        break;
    default: err('Not found', 404);
    }
    break;

// ═══ PAYMENTS ═══════════════════════════════════════════════════
case 'payments':
    switch ($r1) {

    // GET /payments/config  — public keys only (no auth needed)
    case 'config':
        $cfg = pay_settings($pdo);
        send([
            'stripe_enabled'        => ($cfg['stripe_enabled'] ?? 'false') === 'true',
            'stripe_publishable_key'=> $cfg['stripe_publishable_key'] ?? '',
            'currency'              => $cfg['currency'] ?? 'CAD',
            // Cart pricing rules (admin-configurable)
            'shipping_fee'            => isset($cfg['shipping_fee']) && $cfg['shipping_fee'] !== '' ? (float)$cfg['shipping_fee'] : 9.99,
            'free_shipping_threshold' => isset($cfg['free_shipping_threshold']) && $cfg['free_shipping_threshold'] !== '' ? (float)$cfg['free_shipping_threshold'] : 100,
            'tax_rate'                => isset($cfg['tax_rate']) && $cfg['tax_rate'] !== '' ? (float)$cfg['tax_rate'] : 0,
        ]);
        break;

    // GET /payments/settings  — admin full settings
    // PUT /payments/settings  — admin update
    case 'settings':
        authUser($pdo, true);
        if ($method === 'GET') {
            send(pay_settings($pdo));
        } elseif ($method === 'PUT') {
            $b = body();
            $allowed = [
                'stripe_enabled','stripe_publishable_key','stripe_secret_key','stripe_webhook_secret',
                'currency','shipping_fee','free_shipping_threshold','tax_rate',
            ];
            $stmt = $pdo->prepare("INSERT INTO payment_settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)");
            foreach ($allowed as $k) {
                if (array_key_exists($k, $b)) $stmt->execute([$k, (string)$b[$k]]);
            }
            send(pay_settings($pdo));
        } else err('Method not allowed', 405);
        break;

    // POST /payments/stripe/create-intent
    case 'stripe':
        if ($r2 === 'create-intent') {
            if ($method !== 'POST') err('Method not allowed', 405);
            $u   = authUser($pdo);
            $b   = body();
            $cfg = pay_settings($pdo);
            if (($cfg['stripe_enabled'] ?? 'false') !== 'true') err('Stripe not enabled', 400);
            $currency = strtolower($cfg['currency'] ?? 'cad');
            $amount   = (int)(round((float)($b['total'] ?? 0), 2) * 100); // cents
            if ($amount < 50) err('Amount too small', 400);
            // Card only — redirect-based methods (Klarna etc.) aren't handled by this flow
            $res = stripe_curl($pdo, 'payment_intents', [
                'amount'                     => $amount,
                'currency'                   => $currency,
                'payment_method_types[0]'    => 'card',
                'metadata[user_id]'          => $u['id'],
            ]);
            if ($res['error']) err('Stripe error: ' . $res['error'], 502);
            send([
                'clientSecret' => $res['data']['client_secret'],
                'intentId'     => $res['data']['id'],
            ]);
        } elseif ($r2 === 'create-plan-intent') {
            // POST /payments/stripe/create-plan-intent — subscribe to a service
            // plan with RECURRING monthly billing. Prices are authoritative
            // server-side (never trust a client-supplied amount) and MUST
            // mirror src/data/products.js servicePlans exactly. Creates a real
            // Stripe Subscription (inline price_data — no pre-created Price
            // objects needed) and returns the first invoice's PaymentIntent
            // client secret, confirmed the same way a one-time payment is.
            if ($method !== 'POST') err('Method not allowed', 405);
            $u   = authUser($pdo);
            $b   = body();
            $cfg = pay_settings($pdo);
            if (($cfg['stripe_enabled'] ?? 'false') !== 'true') err('Stripe not enabled', 400);
            $planId = $b['plan_id'] ?? '';
            $planPrices = ['basic' => 10.00, 'smart' => 15.00, 'business' => 25.00];
            $planNames  = ['basic' => 'Basic Connect', 'smart' => 'Smart Connect', 'business' => 'Business Connect'];
            if (!isset($planPrices[$planId])) err('Unknown plan', 400);
            $currency = strtolower($cfg['currency'] ?? 'cad');
            $amount   = (int) round($planPrices[$planId] * 100); // cents

            $customerId = stripe_get_or_create_customer($pdo, $u);
            if (!$customerId) err('Could not set up Stripe customer', 502);

            // Switching plans while an old Stripe subscription is still
            // active would double-bill the card — cancel it first.
            $existingSub = $pdo->prepare('SELECT stripe_subscription_id FROM profiles WHERE id=?');
            $existingSub->execute([$u['id']]);
            $oldSubId = $existingSub->fetchColumn();
            if ($oldSubId) {
                stripe_curl($pdo, 'subscriptions/' . $oldSubId, [], 'DELETE');
                $pdo->prepare('UPDATE profiles SET stripe_subscription_id=NULL WHERE id=?')->execute([$u['id']]);
            }

            $res = stripe_curl($pdo, 'subscriptions', [
                'customer' => $customerId,
                'items'    => [[
                    'price_data' => [
                        'currency'    => $currency,
                        'unit_amount' => $amount,
                        'recurring'   => ['interval' => 'month'],
                        'product_data'=> ['name' => $planNames[$planId] . ' — Monthly Plan'],
                    ],
                ]],
                'payment_behavior' => 'default_incomplete',
                'payment_settings' => ['save_default_payment_method' => 'on_subscription'],
                'expand'   => ['latest_invoice.payment_intent'],
                'metadata' => ['user_id' => $u['id'], 'purpose' => 'plan_payment', 'plan_id' => $planId],
            ]);
            if ($res['error']) err('Stripe error: ' . $res['error'], 502);
            $sub = $res['data'];
            $clientSecret = $sub['latest_invoice']['payment_intent']['client_secret'] ?? null;
            if (!$clientSecret) err('Stripe did not return a payment intent', 502);

            send([
                'clientSecret'   => $clientSecret,
                'intentId'       => $sub['latest_invoice']['payment_intent']['id'],
                'subscriptionId' => $sub['id'],
                'amount'         => $planPrices[$planId],
            ]);

        } elseif ($r2 === 'confirm-plan') {
            // POST /payments/stripe/confirm-plan — verify the subscription's
            // first invoice payment succeeded, credit the FULL amount to the
            // user's wallet (used for calls), activate the plan, and remember
            // the subscription id so future renewals (billed automatically by
            // Stripe) are handled by the webhook below.
            if ($method !== 'POST') err('Method not allowed', 405);
            $u        = authUser($pdo);
            $b        = body();
            $intentId = trim($b['intent_id'] ?? '');
            if (!$intentId) err('intent_id required');

            $res = stripe_curl($pdo, 'payment_intents/' . $intentId, [], 'GET');
            if ($res['error'] || ($res['status'] ?? 0) !== 200) err('Could not verify payment', 502);
            $pi = $res['data'];

            if (($pi['status'] ?? '') !== 'succeeded') err('Payment not completed');
            if (($pi['metadata']['purpose'] ?? '') !== 'plan_payment') err('Invalid payment purpose');
            if (($pi['metadata']['user_id'] ?? '') !== $u['id']) err('Payment user mismatch', 403);
            $planId = $pi['metadata']['plan_id'] ?? '';
            $planNames = ['basic' => 'Basic Connect', 'smart' => 'Smart Connect', 'business' => 'Business Connect'];
            if (!isset($planNames[$planId])) err('Invalid plan on payment', 400);

            // Idempotency — never credit the same Stripe payment twice
            $chk = $pdo->prepare("SELECT id FROM wallet_transactions WHERE description LIKE ?");
            $chk->execute(['%' . $intentId . '%']);
            if ($chk->fetch()) err('This payment has already been applied', 409);

            // Find the subscription this invoice/payment belongs to, if any
            $subId = null;
            $inv = stripe_curl($pdo, 'invoices?payment_intent=' . urlencode($intentId), [], 'GET');
            if (!$inv['error'] && !empty($inv['data']['data'][0]['subscription'])) {
                $subId = $inv['data']['data'][0]['subscription'];
            }

            $amountDollars = $pi['amount'] / 100;
            $s = $pdo->prepare('SELECT wallet_balance FROM profiles WHERE id=?');
            $s->execute([$u['id']]);
            $profile = $s->fetch();
            if (!$profile) err('User not found', 404);
            $newBal = (float)$profile['wallet_balance'] + $amountDollars;
            $note   = $planNames[$planId] . ' plan subscription — credited to wallet (Stripe: ' . $intentId . ')';

            $pdo->prepare('UPDATE profiles SET wallet_balance=?, plan=?, status=?, stripe_subscription_id=? WHERE id=?')
                ->execute([$newBal, $planId, 'active', $subId, $u['id']]);
            $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')
                ->execute([$u['id'], $note, $amountDollars, 'credit', $newBal]);

            send(['new_balance' => $newBal, 'amount' => $amountDollars, 'plan' => $planId]);

        } elseif ($r2 === 'refund') {
            // POST /payments/stripe/refund — admin refunds a paid order in full
            if ($method !== 'POST') err('Method not allowed', 405);
            authUser($pdo, true);
            $b       = body();
            $orderId = $b['order_id'] ?? '';
            if (!$orderId) err('order_id required', 400);

            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$orderId]);
            $order = $s->fetch();
            if (!$order) err('Order not found', 404);
            if ($order['payment_status'] !== 'paid') err('Only paid orders can be refunded', 400);
            if (empty($order['stripe_intent_id'])) err('This order has no Stripe payment to refund', 400);

            $res = stripe_curl($pdo, 'refunds', ['payment_intent' => $order['stripe_intent_id']]);
            if (!empty($res['error']) || $res['status'] >= 400) {
                err('Stripe refund failed: ' . ($res['error'] ?: 'HTTP ' . $res['status']), 502);
            }

            $pdo->prepare("UPDATE orders SET payment_status='refunded', status='refunded' WHERE id=?")->execute([$orderId]);
            $pdo->prepare("INSERT INTO payment_transactions (order_id,provider,provider_txn_id,amount,currency,status) VALUES (?,?,?,?,?,?)")
                ->execute([$orderId, 'stripe', $res['data']['id'] ?? '',
                           -1 * (float)($res['data']['amount'] ?? 0) / 100,
                           strtoupper($res['data']['currency'] ?? 'cad'), 'refunded']);

            // Let the customer know
            trigger_order_status_email($pdo, $orderId, 'refunded');

            $s->execute([$orderId]);
            send($s->fetch());

        } elseif ($r2 === 'webhook') {
            // Stripe webhook — verify signature then update order payment status
            $payload    = file_get_contents('php://input');
            $sig        = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
            $cfg        = pay_settings($pdo);
            $secret     = $cfg['stripe_webhook_secret'] ?? '';
            if ($secret) {
                $parts    = [];
                foreach (explode(',', $sig) as $part) {
                    [$k,$v] = explode('=', $part, 2);
                    $parts[$k] = $v;
                }
                $ts       = $parts['t'] ?? 0;
                $expected = hash_hmac('sha256', $ts . '.' . $payload, $secret);
                if (!hash_equals($expected, $parts['v1'] ?? '')) err('Invalid signature', 400);
            }
            $event = json_decode($payload, true);
            if ($event['type'] === 'payment_intent.succeeded') {
                $pi = $event['data']['object'];
                $so = $pdo->prepare("SELECT id, payment_status FROM orders WHERE stripe_intent_id=?");
                $so->execute([$pi['id']]);
                $ord = $so->fetch();
                // Only act once — the checkout confirm endpoint may already have handled it
                if ($ord && $ord['payment_status'] !== 'paid') {
                    $pdo->prepare("UPDATE orders SET payment_status='paid', status='processing' WHERE id=?")
                        ->execute([$ord['id']]);
                    $pdo->prepare("INSERT INTO payment_transactions (order_id,provider,provider_txn_id,amount,currency,status) VALUES (?,?,?,?,?,?)")
                        ->execute([$ord['id'],'stripe',$pi['id'],(float)$pi['amount']/100,strtoupper($pi['currency']),'succeeded']);
                    trigger_order_confirmation($pdo, $ord['id']);
                }
            } elseif ($event['type'] === 'invoice.payment_succeeded') {
                // Recurring plan renewal — Stripe auto-charged the saved card
                // for the next billing cycle. Credit the wallet again, same as
                // the initial subscription payment. The very first invoice
                // (billing_reason=subscription_create) is already handled by
                // /payments/stripe/confirm-plan, so only act on renewals here.
                $inv = $event['data']['object'];
                if (($inv['billing_reason'] ?? '') === 'subscription_cycle' && !empty($inv['subscription'])) {
                    $s = $pdo->prepare("SELECT id, wallet_balance FROM profiles WHERE stripe_subscription_id=?");
                    $s->execute([$inv['subscription']]);
                    $profile = $s->fetch();
                    if ($profile) {
                        $chk = $pdo->prepare("SELECT id FROM wallet_transactions WHERE description LIKE ?");
                        $chk->execute(['%' . $inv['id'] . '%']);
                        if (!$chk->fetch()) {
                            $amount = (float)($inv['amount_paid'] ?? 0) / 100;
                            $newBal = (float)$profile['wallet_balance'] + $amount;
                            $pdo->prepare("UPDATE profiles SET wallet_balance=?, status='active' WHERE id=?")
                                ->execute([$newBal, $profile['id']]);
                            $pdo->prepare('INSERT INTO wallet_transactions (user_id,description,amount,type,balance_after) VALUES (?,?,?,?,?)')
                                ->execute([$profile['id'], "Plan renewal — credited to wallet (Stripe invoice: {$inv['id']})", $amount, 'credit', $newBal]);
                        }
                    }
                }
            } elseif ($event['type'] === 'customer.subscription.deleted') {
                // Subscription ended (cancelled, or payment retries exhausted)
                $sub = $event['data']['object'];
                $pdo->prepare("UPDATE profiles SET plan='none', stripe_subscription_id=NULL WHERE stripe_subscription_id=?")
                    ->execute([$sub['id']]);
            }
            send(['received' => true]);
        } else err('Not found', 404);
        break;

    default: err('Not found', 404);
    }
    break;

// ═══ ORDERS ══════════════════════════════════════════════════════
case 'orders':
    $u = authUser($pdo);

    if ($r1 === null) {
        if ($method === 'GET') {
            if ($u['role'] === 'admin') {
                $rows = $pdo->query("SELECT o.*, GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', ') AS item_names FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id GROUP BY o.id ORDER BY o.created_at DESC LIMIT 200")->fetchAll();
            } else {
                $s = $pdo->prepare("SELECT o.*, GROUP_CONCAT(oi.product_name ORDER BY oi.id SEPARATOR ', ') AS item_names FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.user_id=? GROUP BY o.id ORDER BY o.created_at DESC");
                $s->execute([$u['id']]);
                $rows = $s->fetchAll();
            }
            send($rows);

        } elseif ($method === 'POST') {
            $b       = body();
            $orderId = make_order_id();
            $items   = $b['items'] ?? [];
            $shipping = $b['shipping'] ?? [];
            $subtotal = (float)($b['subtotal'] ?? 0);
            $total    = (float)($b['total'] ?? 0);
            $pm       = $b['payment_method'] ?? 'stripe';
            $intentId = $b['stripe_intent_id'] ?? null;

            if ($total <= 0 || empty($items)) err('Invalid order', 400);

            // Stripe is the only accepted payment gateway
            if ($pm !== 'stripe') err('Invalid payment method', 400);

            $pdo->prepare("INSERT INTO orders (id,user_id,payment_method,payment_status,stripe_intent_id,subtotal,total,shipping_name,shipping_email,shipping_phone,shipping_street,shipping_city,shipping_state,shipping_zip,shipping_country) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
                ->execute([
                    $orderId, $u['id'], $pm,
                    'pending',
                    $intentId,
                    $subtotal, $total,
                    $shipping['fullName'] ?? '', $shipping['email'] ?? '', $shipping['phone'] ?? '',
                    $shipping['street'] ?? '', $shipping['city'] ?? '',
                    $shipping['state'] ?? '', $shipping['zip'] ?? '',
                    $shipping['country'] ?? 'Canada',
                ]);

            $itemStmt = $pdo->prepare("INSERT INTO order_items (order_id,product_id,product_name,product_image,quantity,unit_price,total_price) VALUES (?,?,?,?,?,?,?)");
            foreach ($items as $item) {
                $itemStmt->execute([
                    $orderId,
                    $item['id'] ?? null,
                    $item['name'] ?? '',
                    $item['image'] ?? '',
                    (int)($item['quantity'] ?? 1),
                    (float)($item['price'] ?? 0),
                    (float)(($item['price'] ?? 0) * ($item['quantity'] ?? 1)),
                ]);
            }

            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$orderId]);
            $newOrder = $s->fetch();
            // Fire notifications (non-blocking — errors are swallowed)
            notify_admin_new_order($pdo, $orderId);
            send($newOrder, 201);

        } else err('Method not allowed', 405);

    } else {
        // Single order: GET /orders/:id  PATCH /orders/:id  POST /orders/:id/confirm
        if ($r2 === 'confirm') {
            // Called by checkout after Stripe confirms client-side. Payment status is
            // verified server-side against Stripe — the client is never trusted.
            if ($method !== 'POST') err('Method not allowed', 405);
            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$r1]);
            $order = $s->fetch();
            if (!$order) err('Not found', 404);
            if ($order['user_id'] !== $u['id'] && $u['role'] !== 'admin') err('Forbidden', 403);
            if (empty($order['stripe_intent_id'])) err('No payment on this order', 400);

            if ($order['payment_status'] !== 'paid') {
                $res = stripe_curl($pdo, 'payment_intents/' . $order['stripe_intent_id'], [], 'GET');
                $piStatus = $res['data']['status'] ?? '';
                if ($piStatus !== 'succeeded') err('Payment not completed (status: ' . ($piStatus ?: 'unknown') . ')', 402);
                $pdo->prepare("UPDATE orders SET payment_status='paid', status='processing' WHERE id=?")->execute([$r1]);
                $pdo->prepare("INSERT INTO payment_transactions (order_id,provider,provider_txn_id,amount,currency,status) VALUES (?,?,?,?,?,?)")
                    ->execute([$r1, 'stripe', $order['stripe_intent_id'],
                               (float)($res['data']['amount'] ?? 0) / 100,
                               strtoupper($res['data']['currency'] ?? 'cad'), 'succeeded']);
                trigger_order_confirmation($pdo, $r1);
            }
            $s->execute([$r1]);
            send($s->fetch());

        } elseif ($method === 'GET') {
            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$r1]);
            $order = $s->fetch();
            if (!$order) err('Not found', 404);
            if ($order['user_id'] !== $u['id'] && $u['role'] !== 'admin') err('Forbidden', 403);
            $s2 = $pdo->prepare("SELECT * FROM order_items WHERE order_id=?");
            $s2->execute([$r1]);
            $order['items'] = $s2->fetchAll();
            send($order);

        } elseif ($method === 'PATCH') {
            authUser($pdo, true);
            $b = body();
            $fields = []; $vals = [];
            if (isset($b['status']))         { $fields[] = 'status=?';         $vals[] = $b['status']; }
            if (isset($b['payment_status'])) { $fields[] = 'payment_status=?'; $vals[] = $b['payment_status']; }
            if (!$fields) err('Nothing to update', 400);
            $vals[] = $r1;
            $pdo->prepare("UPDATE orders SET " . implode(',', $fields) . " WHERE id=?")->execute($vals);
            // Email customer when order status changes (not payment_status)
            if (isset($b['status'])) {
                trigger_order_status_email($pdo, $r1, $b['status']);
            }
            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$r1]);
            send($s->fetch());

        } else err('Method not allowed', 405);
    }
    break;

// ═══ ADMIN DASHBOARD STATS ═════════════════════════════════════════
case 'stats':
    authUser($pdo, true);
    if ($method !== 'GET') err('Method not allowed', 405);

    $totalUsers = (int)$pdo->query("SELECT COUNT(*) FROM profiles")->fetchColumn();

    // Revenue = sum of paid orders. A refund flips payment_status to
    // 'refunded', so it naturally drops out of this sum with no extra
    // bookkeeping — this starts at $0 and only grows with real sales.
    $totalRevenue = (float)$pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE payment_status='paid'")->fetchColumn();

    $ordersToday = (int)$pdo->query("SELECT COUNT(*) FROM orders WHERE DATE(created_at)=CURDATE()")->fetchColumn();

    $openTickets = (int)$pdo->query("SELECT COUNT(*) FROM support_tickets WHERE status='open'")->fetchColumn();

    $monthlyRows = $pdo->query("
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, DATE_FORMAT(created_at, '%b') AS month, SUM(total) AS revenue
        FROM orders
        WHERE payment_status='paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY ym, month
        ORDER BY ym ASC
    ")->fetchAll();
    $monthlyRevenue = array_map(fn($r) => ['month' => $r['month'], 'revenue' => (float)$r['revenue']], $monthlyRows);

    $planNames = ['basic' => 'Basic Connect', 'smart' => 'Smart Connect', 'business' => 'Business Connect'];
    $planRows = $pdo->query("SELECT plan, COUNT(*) AS c FROM profiles WHERE plan IN ('basic','smart','business') GROUP BY plan")->fetchAll();
    $planDistribution = array_map(fn($r) => ['name' => $planNames[$r['plan']] ?? $r['plan'], 'value' => (int)$r['c']], $planRows);

    $categoryRows = $pdo->query("
        SELECT p.category AS category, SUM(oi.total_price) AS value
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.payment_status='paid'
        GROUP BY p.category
    ")->fetchAll();
    $categoryLabel = ['home-phone' => 'Home Phone', 'mobile' => 'Mobile'];
    $categorySales = array_map(fn($r) => ['name' => $categoryLabel[$r['category']] ?? ($r['category'] ?: 'Other'), 'value' => (float)$r['value']], $categoryRows);

    $recentOrders = $pdo->query("
        SELECT o.id, o.total, o.status, o.created_at AS date, o.shipping_name AS customer_name
        FROM orders o ORDER BY o.created_at DESC LIMIT 5
    ")->fetchAll();

    send([
        'totalUsers'       => $totalUsers,
        'totalRevenue'     => $totalRevenue,
        'ordersToday'      => $ordersToday,
        'openTickets'      => $openTickets,
        'monthlyRevenue'   => $monthlyRevenue,
        'planDistribution' => $planDistribution,
        'categorySales'    => $categorySales,
        'recentOrders'     => $recentOrders,
    ]);
    break;

// ═══ NOTIFICATIONS ═══════════════════════════════════════════════
case 'notifications':
    authUser($pdo, true);
    $allowed_keys = [
        'email_enabled','admin_email',
        'whatsapp_enabled','whatsapp_phone','whatsapp_provider',
        'whatsapp_apikey','whatsapp_instance','whatsapp_sid','whatsapp_secret','whatsapp_from',
    ];

    if ($r1 === 'settings') {
        if ($method === 'GET') {
            send(notif_settings($pdo));
        } elseif ($method === 'PUT') {
            $b = body();
            foreach ($allowed_keys as $k) {
                if (array_key_exists($k, $b)) notif_set($pdo, $k, (string)$b[$k]);
            }
            send(notif_settings($pdo));
        } else err('Method not allowed', 405);

    } elseif ($r1 === 'test') {
        // POST /notifications/test  — send test message right now
        if ($method !== 'POST') err('Method not allowed', 405);
        $b    = body();
        $type = $b['type'] ?? 'email'; // 'email' | 'whatsapp'
        $fake = [
            'id'             => 'TEST-ORDER',
            'shipping_name'  => 'Test Customer',
            'shipping_email' => $b['email'] ?? 'test@example.com',
            'shipping_phone' => '+1 555-0100',
            'shipping_street'=> '123 Test Street',
            'shipping_city'  => 'Toronto',
            'shipping_state' => 'Ontario',
            'shipping_zip'   => 'M5V 1A1',
            'payment_method' => 'stripe',
            'payment_status' => 'paid',
            'total'          => 199.99,
        ];
        $fakeItems = [[
            'product_name'  => 'Grandstream GRWP810 Test',
            'quantity'      => 1,
            'total_price'   => 199.99,
        ]];
        if ($type === 'email')     send_email_notification($pdo, $fake, $fakeItems);
        if ($type === 'whatsapp')  send_whatsapp_notification($pdo, $fake, $fakeItems);
        send(['sent' => true]);

    } else err('Not found', 404);
    break;

// ═══ SMTP SETTINGS ════════════════════════════════════════════════
case 'smtp':
    authUser($pdo, true);
    $allowed_smtp = ['smtp_enabled','smtp_host','smtp_port','smtp_secure','smtp_user','smtp_pass','smtp_from','smtp_from_name'];

    if ($r1 === 'settings') {
        if ($method === 'GET') {
            $rows = $pdo->query("SELECT `key`,`value` FROM smtp_settings")->fetchAll();
            $out  = [];
            foreach ($rows as $r) $out[$r['key']] = $r['value'];
            // Never return the password to the client — return a mask instead
            if (!empty($out['smtp_pass'])) $out['smtp_pass'] = '••••••••';
            send($out);

        } elseif ($method === 'PUT') {
            $b = body();
            foreach ($allowed_smtp as $k) {
                if (!array_key_exists($k, $b)) continue;
                $val = (string)$b[$k];
                // Don't overwrite password if client sent back the mask
                if ($k === 'smtp_pass' && $val === '••••••••') continue;
                $pdo->prepare("INSERT INTO smtp_settings (`key`,`value`) VALUES (?,?) ON DUPLICATE KEY UPDATE `value`=VALUES(`value`)")->execute([$k, $val]);
            }
            $rows = $pdo->query("SELECT `key`,`value` FROM smtp_settings")->fetchAll();
            $out  = [];
            foreach ($rows as $r) $out[$r['key']] = $r['value'];
            if (!empty($out['smtp_pass'])) $out['smtp_pass'] = '••••••••';
            send($out);

        } else err('Method not allowed', 405);

    } elseif ($r1 === 'test') {
        if ($method !== 'POST') err('Method not allowed', 405);
        $b    = body();
        $to   = trim($b['email'] ?? '');
        if (!$to) err('Test email address required');
        // Verify PHPMailer library exists before attempting
        if (!file_exists(__DIR__ . '/phpmailer/PHPMailer.php')) {
            send(['sent' => false, 'error' => 'PHPMailer library missing from server. Re-deploy the site to upload api/phpmailer/ folder.']);
        }
        $html = emailWrap('SMTP Test', "
          <h2 style='color:#0a1628;'>SMTP is working! &#10003;</h2>
          <p style='color:#555;'>This is a test email from your Oasis Orchard Technologies admin panel.</p>
          <p style='color:#888;font-size:13px;'>If you received this, your SMTP settings are correctly configured.</p>
        ", 'SMTP test from Oasis Orchard Technologies');
        $sent  = sendMail($to, 'Admin', 'SMTP Test — Oasis Orchard Technologies', $html);
        $error = $GLOBALS['_mailer_last_error'] ?? '';
        send(['sent' => $sent, 'to' => $to, 'error' => $error]);

    } else err('Not found', 404);
    break;

// ═══ VOIP.MS API PROXY ═══════════════════════════════════════════
case 'voipms':
    $u = authUser($pdo);

    // Load VoIP.ms admin credentials from voip_settings
    $rows = $pdo->query("SELECT `key`,`value` FROM voip_settings WHERE `key` IN ('voipms_api_user','voipms_api_pass')")->fetchAll();
    $cfg  = [];
    foreach ($rows as $r) $cfg[$r['key']] = json_decode($r['value'], true);

    if (empty($cfg['voipms_api_user']) || empty($cfg['voipms_api_pass'])) {
        err('VoIP.ms credentials not configured', 503);
    }

    $method = $_GET['method'] ?? '';

    // Allowed methods for regular users (read-only)
    $userMethods  = ['getRegistrationStatus', 'getCDR', 'getSubAccounts', 'getVoicemailMessages', 'sendSMS', 'getServersInfo'];
    // Extra methods only admins may call
    $adminMethods = ['createSubAccount', 'delSubAccount', 'setSubAccount'];
    $allowed = $u['role'] === 'admin' ? array_merge($userMethods, $adminMethods) : $userMethods;

    if (!$method || !in_array($method, $allowed, true)) err('Method not allowed', 403);

    // Build params — strip our internal keys (auth is injected by voipms_call)
    $params = $_GET;
    unset($params['method'], $params['all']); // clean up

    $resp = voipms_call($cfg['voipms_api_user'], $cfg['voipms_api_pass'], $method, $params);
    if ($resp === null) err('VoIP.ms API unreachable', 502);
    send($resp);
    break;

// ═══ VOIP.MS SUB-ACCOUNT PROVISIONING ════════════════════════════
case 'provision':
    // createSubAccount is a slow WRITE on VoIP.ms's side — routinely 20-35s.
    // The whole reason this endpoint kept failing with "no_response" was a
    // 20s curl timeout that gave up before VoIP.ms ever answered, so we
    // never got a direct success and instead fell through to re-checks that
    // ran before the account was queryable. We now wait long enough for the
    // create to actually return, so success is captured directly and we no
    // longer depend on VoIP.ms's indexing lag. PHP's own limit is raised to
    // match (harmless no-op if disabled).
    if (function_exists('set_time_limit')) @set_time_limit(120);

    $admin = authUser($pdo, true);

    // Load VoIP.ms credentials
    $rows = $pdo->query("SELECT `key`,`value` FROM voip_settings WHERE `key` IN ('voipms_api_user','voipms_api_pass','voipms_server')")->fetchAll();
    $cfg  = [];
    foreach ($rows as $r) $cfg[$r['key']] = json_decode($r['value'], true);

    if (empty($cfg['voipms_api_user']) || empty($cfg['voipms_api_pass'])) err('VoIP.ms credentials not configured', 503);

    $b          = body();
    $target_uid = $b['user_id'] ?? null;
    if (!$target_uid) err('user_id required', 400);

    // Look up the user's email — used as the VoIP.ms sub-account description
    // so accounts are identifiable in the VoIP.ms portal
    $urow = $pdo->prepare('SELECT email FROM profiles WHERE id=?');
    $urow->execute([$target_uid]);
    $userEmail  = $urow->fetchColumn() ?: '';
    $subDescription = $userEmail !== '' ? $userEmail : 'Oasis Orchard user';

    // Generate unique sub-account name — VoIP.ms caps usernames at 12 chars,
    // longer names get truncated on their side and then never match ours
    $short   = preg_replace('/[^a-z0-9]/', '', strtolower(substr($target_uid, 0, 11)));
    $subname = 'u' . $short;

    // Generate SIP password — VoIP.ms wants 8-16 chars, letters + numbers
    // (special characters can be rejected, so stay strictly alphanumeric)
    $chars   = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ';
    $sipPass = '';
    for ($i = 0; $i < 8; $i++) $sipPass .= $chars[random_int(0, strlen($chars) - 1)];
    $sipPass .= (string)random_int(1000, 9999); // guarantees digits; 12 chars total

    $apiUser = $cfg['voipms_api_user'];
    $apiPass = $cfg['voipms_api_pass'];
    $server  = $cfg['voipms_server'] ?? 'webrtc.voip.ms';

    // Helper: find our sub-account entry in a getSubAccounts response.
    // Checked two independent ways so a mismatch in one doesn't cause a false
    // "not found": (1) the description is the user's email — exact and
    // unambiguous, doesn't depend on any assumption about how VoIP.ms formats
    // the account name; (2) the account name ("<mainaccount>_<subname>")
    // matches ours, also handling truncated names an older code version
    // created before the 12-char limit was enforced. Returns the full entry.
    $findSub = function ($list) use ($subname, $userEmail) {
        $wantEmail = strtolower(trim($userEmail));
        $wantSub   = strtolower($subname);
        foreach (($list['accounts'] ?? []) as $a) {
            // (1) description == the user's email is the most reliable key —
            // it doesn't depend on how VoIP.ms formatted the username.
            // Compared case-insensitively/trimmed since VoIP.ms can normalise it.
            $desc = strtolower(trim($a['description'] ?? ''));
            if ($wantEmail !== '' && $desc === $wantEmail) return $a;

            // (2) match on the username. VoIP.ms may truncate or change case,
            // so compare loosely: exact sub-portion, either being a prefix of
            // the other, or the full account simply containing our (distinctive,
            // user-id-derived) subname.
            $acct = strtolower($a['account'] ?? '');
            if ($acct === '') continue;
            $pos = strrpos($acct, '_');
            $sub = $pos !== false ? substr($acct, $pos + 1) : $acct;
            if ($sub === $wantSub
                || (strlen($sub) >= 6 && strpos($wantSub, $sub) === 0)      // stored name truncated vs. ours
                || (strlen($wantSub) >= 6 && strpos($sub, $wantSub) === 0)  // ours truncated vs. stored
                || strpos($acct, $wantSub) !== false                        // subname appears anywhere
            ) return $a;
        }
        return null;
    };

    $subParams = [
        'protocol'            => 1,     // SIP
        'auth_type'           => 1,     // Password auth
        'device_type'         => 2,     // IP PBX / softphone (required by VoIP.ms)
        'description'         => $subDescription, // the user's email
        'lock_international'  => 0,
        'international_route' => 1,     // 1 = Value route; VoIP.ms rejects 0 as "missing"
        'music_on_hold'       => 'default',
        'allowed_codecs'      => 'ulaw;g729;gsm',
        'dtmf_mode'           => 'rfc2833',
        'nat'                 => 'yes',
    ];

    // Reuse an existing sub-account: reset its password so we always end up
    // with credentials we can store and email. If the reset fails, keep the
    // previously stored password instead of overwriting it with a bad one.
    // setSubAccount is one of the two calls known to be slow on VoIP.ms's side.
    $reuse = function ($entry) use ($apiUser, $apiPass, $subParams, &$sipPass) {
        $reset = voipms_call($apiUser, $apiPass, 'setSubAccount', array_merge($subParams, [
            'id'       => $entry['id'] ?? '',
            'password' => $sipPass,
        ]), 20);
        if (!$reset || ($reset['status'] ?? '') !== 'success') $sipPass = null;
        return $entry['account'];
    };

    // Check if sub-account already exists
    $list = voipms_call($apiUser, $apiPass, 'getSubAccounts');
    if ($list === null) err('VoIP.ms API unreachable — check the server\'s outbound internet access', 502);
    $listStatus = $list['status'] ?? 'no_response';
    // "no_subaccount(s)" just means none exist yet — anything else non-success is a real error
    if ($listStatus !== 'success' && strpos($listStatus, 'no_subaccount') !== 0) {
        err('VoIP.ms error: ' . $listStatus . voipms_error_hint($listStatus), 502);
    }
    $existing    = $listStatus === 'success' ? $findSub($list) : null;
    $sipUsername = $existing ? $reuse($existing) : null;

    if ($sipUsername === null) {
        // Create the sub-account on VoIP.ms. Given a generous 45s timeout so
        // the (slow) write actually finishes and returns 'success' directly —
        // that's the reliable path, because it hands us the account name and
        // needs no follow-up lookup at all. The re-check below only matters
        // in the rare case curl still gives up before VoIP.ms answers.
        $result = voipms_call($apiUser, $apiPass, 'createSubAccount', array_merge($subParams, [
            'username' => $subname,
            'password' => $sipPass,
        ]), 45);
        $status = $result['status'] ?? 'no_response';
        if ($status !== 'success' && $status !== 'used_username') {
            // The create may still have gone through on VoIP.ms's side —
            // "no_response" (curl gave up) and "used_username" both mean the
            // account can exist even though we didn't get a clean success.
            // Re-check a few times with short pauses, in case VoIP.ms hasn't
            // finished indexing it yet.
            $existing = null;
            foreach ([0, 4, 6] as $wait) {
                if ($wait) sleep($wait);
                $recheck  = voipms_call($apiUser, $apiPass, 'getSubAccounts', [], 15);
                $existing = ($recheck && ($recheck['status'] ?? '') === 'success') ? $findSub($recheck) : null;
                if ($existing) break;
            }
            if (!$existing) {
                $seen = array_map(
                    fn($a) => ($a['account'] ?? '?') . ' (' . ($a['description'] ?? '') . ')',
                    $recheck['accounts'] ?? []
                );
                error_log('[VoIP.ms provision] wanted subname=' . $subname . ' email=' . $userEmail
                    . ' status=' . $status . ' — accounts seen: ' . ($seen ? implode(', ', $seen) : 'none'));
                err('VoIP.ms sub-account creation failed: ' . $status . voipms_error_hint($status)
                    . '. If this keeps happening right after clicking Provision, wait about 30 seconds '
                    . 'and click Provision again — VoIP.ms may still be indexing the account, and the '
                    . 'existing-account check will find and reuse it instead of erroring.', 502);
            }
            $sipUsername = $reuse($existing);
        } elseif ($status === 'used_username') {
            // Account already exists under our deterministic name — look it up
            // and reuse it (reset password) rather than treating it as an error.
            $recheck  = voipms_call($apiUser, $apiPass, 'getSubAccounts', [], 15);
            $existing = ($recheck && ($recheck['status'] ?? '') === 'success') ? $findSub($recheck) : null;
            if (!$existing) err('VoIP.ms reports the sub-account already exists but it could not be found to reuse', 502);
            $sipUsername = $reuse($existing);
        } else {
            // VoIP.ms returns the full account name ("<mainaccount>_<subname>")
            $sipUsername = $result['account'] ?? null;
            if (!$sipUsername) {
                // Fallback: look it up so we never store a guessed username
                $recheck     = voipms_call($apiUser, $apiPass, 'getSubAccounts');
                $entry       = ($recheck && ($recheck['status'] ?? '') === 'success') ? $findSub($recheck) : null;
                $sipUsername = $entry['account'] ?? null;
            }
            if (!$sipUsername) err('VoIP.ms sub-account created but could not resolve SIP username', 502);
        }
    }

    // Save to local DB
    $pdo->prepare(
        'INSERT INTO voip_accounts (user_id, sip_username, sip_password, sip_server, voip_enabled) VALUES (?,?,?,?,1)
         ON DUPLICATE KEY UPDATE sip_username=VALUES(sip_username), sip_password=COALESCE(VALUES(sip_password), sip_password), sip_server=VALUES(sip_server)'
    )->execute([$target_uid, $sipUsername, $sipPass, $server]);

    // Email user their new SIP credentials
    trigger_voip_provisioned($pdo, $target_uid, $sipUsername, $server);

    // Return the account so admin can see it
    $s = $pdo->prepare('SELECT * FROM voip_accounts WHERE user_id=?');
    $s->execute([$target_uid]);
    send($s->fetch());
    break;

// ═══ SUPPORT EMAILS ═══════════════════════════════════════════════
// POST /api/support-notify/new      — user submits support message
// POST /api/support-notify/reply    — admin replies (admin only)
case 'support-notify':
    if ($method !== 'POST') err('Method not allowed', 405);

    if ($r1 === 'new') {
        $u = authUser($pdo);
        $b = body();
        $subject = trim($b['subject'] ?? '');
        $message = trim($b['message'] ?? '');
        if (!$subject || !$message) err('Subject and message required');
        // Get user name
        $ps = $pdo->prepare('SELECT name FROM profiles WHERE id=?');
        $ps->execute([$u['id']]);
        $uname = $ps->fetch()['name'] ?? '';
        trigger_support_msg_admin($uname, $u['email'], $subject, $message);
        send(['sent' => true]);

    } elseif ($r1 === 'reply') {
        authUser($pdo, true);
        $b = body();
        $toEmail = trim($b['user_email'] ?? '');
        $toName  = trim($b['user_name']  ?? '');
        $subject = trim($b['subject']    ?? '');
        $message = trim($b['message']    ?? '');
        if (!$toEmail || !$subject || !$message) err('user_email, subject, and message required');
        trigger_support_reply_user($toEmail, $toName, $subject, $message);
        send(['sent' => true]);

    } else err('Not found', 404);
    break;

// ═══ EMAIL TEMPLATES ══════════════════════════════════════════════
// GET    /api/email-templates          — list all
// GET    /api/email-templates/:id      — get one
// POST   /api/email-templates          — create
// PUT    /api/email-templates/:id      — update
// DELETE /api/email-templates/:id      — delete
// POST   /api/email-templates/:id/reset — reset to default
// POST   /api/email-templates/:id/test  — test send
case 'email-templates':
    authUser($pdo, true);
    seed_email_templates(); // seed defaults on first access

    if ($method === 'GET' && $r1 === null) {
        // List all templates
        $rows = $pdo->query("SELECT id, name, subject, variables, is_active, is_system, updated_at FROM email_templates ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['is_active'] = (bool)$row['is_active'];
            $row['is_system'] = (bool)$row['is_system'];
            $row['variables'] = $row['variables'] ? json_decode($row['variables'], true) : [];
        }
        send($rows);
    }

    if ($method === 'GET' && $r1 !== null && $r2 === null) {
        // Get one
        $stmt = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
        $stmt->execute([$r1]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) err('Template not found', 404);
        $row['is_active'] = (bool)$row['is_active'];
        $row['is_system'] = (bool)$row['is_system'];
        $row['variables'] = $row['variables'] ? json_decode($row['variables'], true) : [];
        send($row);
    }

    if ($method === 'POST' && $r1 === null) {
        // Create new template
        $b = body();
        $id      = trim($b['id'] ?? '');
        $name    = trim($b['name'] ?? '');
        $subject = trim($b['subject'] ?? '');
        $body_html = trim($b['body_html'] ?? '');
        if (!$id || !$name || !$subject || !$body_html) err('id, name, subject, and body_html are required');
        if (!preg_match('/^[a-z0-9_-]+$/', $id)) err('id must be lowercase letters, numbers, underscores or hyphens');
        $vars = isset($b['variables']) && is_array($b['variables']) ? json_encode($b['variables']) : null;
        $stmt = $pdo->prepare("INSERT INTO email_templates (id, name, subject, body_html, variables, is_active, is_system) VALUES (?,?,?,?,?,1,0)");
        try {
            $stmt->execute([$id, $name, $subject, $body_html, $vars]);
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') err('A template with this ID already exists', 409);
            throw $e;
        }
        $stmt2 = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
        $stmt2->execute([$id]);
        $row = $stmt2->fetch(PDO::FETCH_ASSOC);
        $row['is_active'] = (bool)$row['is_active'];
        $row['is_system'] = (bool)$row['is_system'];
        $row['variables'] = $row['variables'] ? json_decode($row['variables'], true) : [];
        send($row, 201);
    }

    if ($method === 'PUT' && $r1 !== null && $r2 === null) {
        // Update template
        $stmt = $pdo->prepare("SELECT id FROM email_templates WHERE id = ?");
        $stmt->execute([$r1]);
        if (!$stmt->fetch()) err('Template not found', 404);
        $b = body();
        $fields = []; $params = [];
        if (isset($b['name']))      { $fields[] = 'name = ?';      $params[] = trim($b['name']); }
        if (isset($b['subject']))   { $fields[] = 'subject = ?';   $params[] = trim($b['subject']); }
        if (isset($b['body_html'])) { $fields[] = 'body_html = ?'; $params[] = $b['body_html']; }
        if (isset($b['is_active'])) { $fields[] = 'is_active = ?'; $params[] = $b['is_active'] ? 1 : 0; }
        if (isset($b['variables'])) { $fields[] = 'variables = ?'; $params[] = is_array($b['variables']) ? json_encode($b['variables']) : $b['variables']; }
        if ($fields) {
            $params[] = $r1;
            $pdo->prepare("UPDATE email_templates SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);
        }
        $stmt2 = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
        $stmt2->execute([$r1]);
        $row = $stmt2->fetch(PDO::FETCH_ASSOC);
        $row['is_active'] = (bool)$row['is_active'];
        $row['is_system'] = (bool)$row['is_system'];
        $row['variables'] = $row['variables'] ? json_decode($row['variables'], true) : [];
        send($row);
    }

    if ($method === 'DELETE' && $r1 !== null && $r2 === null) {
        // Delete template
        $pdo->prepare("DELETE FROM email_templates WHERE id = ?")->execute([$r1]);
        send(['deleted' => true]);
    }

    if ($method === 'POST' && $r1 !== null && $r2 === 'reset') {
        // Reset template to default
        $defaults = default_email_templates();
        if (!isset($defaults[$r1])) err('No default for this template', 404);
        $t = $defaults[$r1];
        $pdo->prepare("INSERT INTO email_templates (id, name, subject, body_html, variables, is_active, is_system)
            VALUES (?,?,?,?,?,1,1)
            ON DUPLICATE KEY UPDATE name=VALUES(name), subject=VALUES(subject), body_html=VALUES(body_html), variables=VALUES(variables), is_system=1")
            ->execute([$r1, $t['name'], $t['subject'], $t['body_html'], $t['variables']]);
        $stmt = $pdo->prepare("SELECT * FROM email_templates WHERE id = ?");
        $stmt->execute([$r1]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $row['is_active'] = (bool)$row['is_active'];
        $row['is_system'] = (bool)$row['is_system'];
        $row['variables'] = $row['variables'] ? json_decode($row['variables'], true) : [];
        send($row);
    }

    if ($method === 'POST' && $r1 !== null && $r2 === 'test') {
        // Test send a template
        $b = body();
        $toEmail = trim($b['email'] ?? '');
        if (!$toEmail) err('email is required');
        $stmt = $pdo->prepare("SELECT subject, body_html, is_active FROM email_templates WHERE id = ?");
        $stmt->execute([$r1]);
        $tpl = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$tpl) err('Template not found', 404);

        // Render with placeholder values
        $subject  = $tpl['subject'];
        $bodyHtml = $tpl['body_html'];
        // Replace any remaining {{variables}} with [sample] so the preview looks clean
        $subject  = preg_replace('/\{\{[^}]+\}\}/', '[sample]', $subject);
        $bodyHtml = preg_replace('/\{\{[^}]+\}\}/', '<em style="color:#1bb0ce;">[sample value]</em>', $bodyHtml);

        $html = emailWrap('Test: ' . $subject, $bodyHtml);
        $ok = sendMail($toEmail, 'Admin', '[TEST] ' . $subject, $html);
        if (!$ok) err($GLOBALS['_mailer_last_error'] ?: 'Failed to send test email');
        send(['sent' => true, 'to' => $toEmail]);
    }

    err('Not found', 404);
    break;

default:
    err('Not found', 404);
}
