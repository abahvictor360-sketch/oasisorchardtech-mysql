-- ============================================================
-- Security Schema — Oasis Orchard Technologies
-- Run in phpMyAdmin (after mysql-schema.sql)
-- ============================================================

SET NAMES utf8mb4;

-- Failed login attempts (rate limiting: 5 fails / 15 min per email+IP)
CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  ip           VARCHAR(64)  NOT NULL DEFAULT '',
  attempted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempts (email, ip, attempted_at)
);
