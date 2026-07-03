<?php
// ── Credentials loader ─────────────────────────────────────────
// Real credentials live in oasis-config.php ONE LEVEL ABOVE
// public_html (e.g. /home/u123456789/domains/yourdomain.com/oasis-config.php).
// Git deploys only touch public_html, so that file survives every redeploy.
$secretFile = dirname(__DIR__, 2) . '/oasis-config.php';
if (is_file($secretFile)) require $secretFile;

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
    echo json_encode(['error' => 'Service temporarily unavailable']);
    exit;
}

// Hide PHP errors from responses (they leak paths and internals)
ini_set('display_errors', '0');
error_reporting(E_ALL);
