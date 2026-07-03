<?php
// ── Database credentials — fill these in on Hostinger ────────
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_database_name');   // e.g. u123456789_oasis
define('DB_USER', 'your_database_user');   // e.g. u123456789_admin
define('DB_PASS', 'your_database_password');

// ── CORS — set to your actual domain in production ───────────
$allowed = ['http://localhost:5173', 'https://yourdomain.com'];
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

// ── Database connection ───────────────────────────────────────
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
