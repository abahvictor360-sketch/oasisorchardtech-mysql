<?php
// ── Credentials loader ─────────────────────────────────────────
// Real credentials live in oasis-config.php OUTSIDE public_html so
// Git deploys (which wipe public_html) never touch it.
// The loader searches every parent folder up to the account root,
// so the file works no matter which level above public_html it's in.
// Every candidate path is recorded (not just the winner) so /api/health
// can show exactly where PHP looked — no more guessing which folder
// the file needs to sit in.
$__configFoundAt    = null;
$__configCheckedAt  = [];
for ($lvl = 1; $lvl <= 6; $lvl++) {
    $candidate = dirname(__DIR__, $lvl) . '/oasis-config.php';
    $__configCheckedAt[] = ['level' => $lvl, 'path' => $candidate, 'exists' => is_file($candidate)];
    if ($__configFoundAt === null && is_file($candidate)) {
        require $candidate;
        $__configFoundAt = $lvl;
    }
}

// Fallbacks for local development (no secrets committed here)
if (!defined('DB_HOST'))  define('DB_HOST', 'localhost');
if (!defined('DB_NAME'))  define('DB_NAME', '');
if (!defined('DB_USER'))  define('DB_USER', '');
if (!defined('DB_PASS'))  define('DB_PASS', '');
if (!defined('SITE_URL')) define('SITE_URL', 'https://yourdomain.com');

// ── CORS ───────────────────────────────────────────────────────
$allowed = ['http://localhost:5173', SITE_URL];
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed) || $origin === '') {
    header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
} else {
    header('Access-Control-Allow-Origin: ' . $allowed[1]);
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Database connection ────────────────────────────────────────
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER, DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    // Never leak connection details (host, user, password hints) to the client
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    // /api/health gets diagnostics (paths only, no secrets) so setup problems are visible
    if (strpos($_SERVER['REQUEST_URI'] ?? '', '/api/health') !== false) {
        echo json_encode([
            'status'         => 'error',
            'db'             => 'connection failed',
            'config_file'    => $__configFoundAt !== null ? 'found' : 'MISSING',
            'checked_paths'  => $__configCheckedAt,
            'hint'           => $__configFoundAt === null
                ? 'None of the checked paths above have oasis-config.php. Upload it to one of those exact paths — the one directly above your public_html folder is usually correct.'
                : null,
        ]);
    } else {
        echo json_encode(['error' => 'Service temporarily unavailable']);
    }
    exit;
}

// Hide PHP errors from responses (they leak paths and internals)
ini_set('display_errors', '0');
error_reporting(E_ALL);
