-- Run in Hostinger phpMyAdmin → SQL tab
-- Adds email verification, password reset, and SMTP settings table

-- 1. Email auth columns on users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified      TINYINT(1)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_verify_token  VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token         VARCHAR(64) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME    DEFAULT NULL;

-- 2. SMTP settings table
CREATE TABLE IF NOT EXISTS smtp_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`    TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. Default SMTP rows
INSERT INTO smtp_settings (`key`, `value`) VALUES
  ('smtp_enabled',   'false'),
  ('smtp_host',      'smtp.hostinger.com'),
  ('smtp_port',      '587'),
  ('smtp_secure',    'tls'),
  ('smtp_user',      ''),
  ('smtp_pass',      ''),
  ('smtp_from',      ''),
  ('smtp_from_name', 'Oasis Orchard Technologies')
ON DUPLICATE KEY UPDATE `key` = `key`;
