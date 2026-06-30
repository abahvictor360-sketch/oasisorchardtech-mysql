-- ============================================================
-- Oasis Orchard Technologies — Admin Account Seed
-- Run this in phpMyAdmin AFTER importing mysql-schema.sql
-- ============================================================
--
--   Email    : admin@oasisorchard.com
--   Password : Admin@1234
--
-- Log in and change the password immediately after first login.
-- ============================================================

SET NAMES utf8mb4;

SET @admin_id = UUID();

INSERT INTO users (id, email, password_hash, role, created_at)
VALUES (
  @admin_id,
  'admin@oasisorchard.com',
  '$2b$10$n4IHmMRFGS/nD/yfxHxI4.ud8ZLDgidVAbBB9kvhkFtqfw5dyYhfu',
  'admin',
  NOW()
)
ON DUPLICATE KEY UPDATE
  role         = 'admin',
  password_hash = '$2b$10$n4IHmMRFGS/nD/yfxHxI4.ud8ZLDgidVAbBB9kvhkFtqfw5dyYhfu';

INSERT INTO profiles (id, email, name, phone, address, plan, role, status, wallet_balance, created_at)
SELECT id, email, 'Site Admin', '', '', 'business', 'admin', 'active', 0.00, NOW()
FROM users
WHERE email = 'admin@oasisorchard.com'
ON DUPLICATE KEY UPDATE
  name   = 'Site Admin',
  role   = 'admin',
  status = 'active';
