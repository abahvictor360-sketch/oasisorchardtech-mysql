<?php
require_once __DIR__ . '/config.php';

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
    $headers = implode("\r\n", [
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        'From: Oasis Orchard <noreply@oasisorchard.com>',
        'X-Mailer: PHP/' . PHP_VERSION,
    ]);
    @mail($to, $subject, $html, $headers);
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

function paypal_base($mode) {
    return $mode === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
}

function paypal_token($client_id, $secret, $mode) {
    $ch = curl_init(paypal_base($mode) . '/v1/oauth2/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
        CURLOPT_USERPWD        => $client_id . ':' . $secret,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded',
        ],
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res['access_token'] ?? null;
}

function paypal_curl($token, $endpoint, $data, $mode, $httpMethod = 'POST') {
    $ch = curl_init(paypal_base($mode) . $endpoint);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => $httpMethod,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $token,
            'Content-Type: application/json',
            'Accept: application/json',
        ],
    ];
    if ($httpMethod !== 'GET' && !empty($data))
        $opts[CURLOPT_POSTFIELDS] = json_encode($data);
    curl_setopt_array($ch, $opts);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['data' => json_decode($res, true), 'status' => $code];
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
        'status'      => 'ok',
        'db'          => 'connected',
        'config_file' => isset($__configFoundAt) && $__configFoundAt !== null
            ? 'found (' . $__configFoundAt . ' level(s) above the api folder)'
            : 'using fallback values',
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
        $id   = bin2hex(random_bytes(18));
        $hash = password_hash($pass, PASSWORD_BCRYPT);
        $pdo->prepare('INSERT INTO users (id,email,password_hash,role) VALUES (?,?,?,?)')->execute([$id,$email,$hash,'user']);
        $pdo->prepare('INSERT INTO profiles (id,email,name,phone,plan,role) VALUES (?,?,?,?,?,?)')->execute([
            $id,$email,$meta['name']??'',$meta['phone']??'',$meta['plan']??'basic','user',
        ]);
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
        send(['new_balance'=>$newBal]);
    } else {
        $u = authUser($pdo);
        $uid = $r1 ?? $u['id'];
        if ($uid !== $u['id'] && $u['role'] !== 'admin') err('Forbidden',403);
        $s = $pdo->prepare('SELECT * FROM wallet_transactions WHERE user_id=? ORDER BY created_at DESC');
        $s->execute([$uid]);
        send($s->fetchAll());
    }
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
            $pdo->prepare('UPDATE voip_calls SET status=?,duration_seconds=?,cost=?,ended_at=? WHERE id=? AND user_id=?')->execute([
                $b['status']??'ended', (int)($b['duration_seconds']??0),
                (float)($b['cost']??0), $b['ended_at']??null, $r2, $u['id'],
            ]);
            send(['updated'=>true]);
        }
        break;
    case 'settings':
        $rows = $pdo->query("SELECT `key`, `value` FROM voip_settings")->fetchAll();
        $map  = [];
        foreach ($rows as $r) $map[$r['key']] = json_decode($r['value'], true);
        send($map);
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
            'paypal_enabled'        => ($cfg['paypal_enabled'] ?? 'false') === 'true',
            'paypal_client_id'      => $cfg['paypal_client_id'] ?? '',
            'paypal_mode'           => $cfg['paypal_mode'] ?? 'sandbox',
            'currency'              => $cfg['currency'] ?? 'CAD',
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
                'paypal_enabled','paypal_client_id','paypal_client_secret','paypal_mode','currency',
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
            $res = stripe_curl($pdo, 'payment_intents', [
                'amount'                     => $amount,
                'currency'                   => $currency,
                'automatic_payment_methods[enabled]' => 'true',
                'metadata[user_id]'          => $u['id'],
            ]);
            if ($res['error']) err('Stripe error: ' . $res['error'], 502);
            send([
                'clientSecret' => $res['data']['client_secret'],
                'intentId'     => $res['data']['id'],
            ]);
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
                $pdo->prepare("UPDATE orders SET payment_status='paid', status='processing' WHERE stripe_intent_id=?")
                    ->execute([$pi['id']]);
                $pdo->prepare("INSERT INTO payment_transactions (order_id,provider,provider_txn_id,amount,currency,status) SELECT id,?,?,?,?,? FROM orders WHERE stripe_intent_id=?")
                    ->execute(['stripe',$pi['id'],(float)$pi['amount']/100,strtoupper($pi['currency']),'succeeded',$pi['id']]);
            }
            send(['received' => true]);
        } else err('Not found', 404);
        break;

    // POST /payments/paypal/create-order
    // POST /payments/paypal/capture
    case 'paypal':
        $u   = authUser($pdo);
        $cfg = pay_settings($pdo);
        if (($cfg['paypal_enabled'] ?? 'false') !== 'true') err('PayPal not enabled', 400);
        $mode   = $cfg['paypal_mode'] ?? 'sandbox';
        $tok    = paypal_token($cfg['paypal_client_id']??'', $cfg['paypal_client_secret']??'', $mode);
        if (!$tok) err('PayPal auth failed', 502);
        $currency = strtoupper($cfg['currency'] ?? 'CAD');

        if ($r2 === 'create-order') {
            if ($method !== 'POST') err('Method not allowed', 405);
            $b     = body();
            $total = number_format((float)($b['total'] ?? 0), 2, '.', '');
            $res   = paypal_curl($tok, '/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => ['currency_code' => $currency, 'value' => $total],
                    'description' => 'Oasis Orchard Technologies Order',
                ]],
            ], $mode);
            if ($res['status'] >= 400) err('PayPal error', 502);
            send(['paypalOrderId' => $res['data']['id']]);

        } elseif ($r2 === 'capture') {
            if ($method !== 'POST') err('Method not allowed', 405);
            $b            = body();
            $paypalOrderId = $b['paypalOrderId'] ?? '';
            $dbOrderId    = $b['orderId'] ?? '';
            if (!$paypalOrderId) err('PayPal order ID required', 400);
            $res = paypal_curl($tok, "/v2/checkout/orders/{$paypalOrderId}/capture", [], $mode);
            if ($res['status'] >= 400) err('PayPal capture failed', 502);
            $capture = $res['data']['purchase_units'][0]['payments']['captures'][0] ?? [];
            // Update order in DB
            if ($dbOrderId) {
                $pdo->prepare("UPDATE orders SET payment_status='paid', status='processing', paypal_order_id=? WHERE id=?")
                    ->execute([$paypalOrderId, $dbOrderId]);
                $captureId = $capture['id'] ?? null;
                $pdo->prepare("INSERT INTO payment_transactions (order_id,provider,provider_txn_id,amount,currency,status) VALUES (?,?,?,?,?,?)")
                    ->execute([$dbOrderId,'paypal',$captureId,(float)($capture['amount']['value']??0),$currency,'captured']);
            }
            send(['status' => 'captured', 'captureId' => $capture['id'] ?? null]);
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

            // Only real payment gateways are accepted (wallet/pay-later disabled)
            if (!in_array($pm, ['stripe', 'paypal'], true)) err('Invalid payment method', 400);

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
        // Single order: GET /orders/:id  PATCH /orders/:id
        if ($method === 'GET') {
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
            $s = $pdo->prepare("SELECT * FROM orders WHERE id=?");
            $s->execute([$r1]);
            send($s->fetch());

        } else err('Method not allowed', 405);
    }
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

default:
    err('Not found', 404);
}
