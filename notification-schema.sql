-- ============================================================
-- Notification Settings Schema — Oasis Orchard Technologies
-- Run in phpMyAdmin (after mysql-schema.sql and payment-schema.sql)
-- ============================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notification_settings (
  `key`      VARCHAR(100) NOT NULL,
  `value`    TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
);

INSERT INTO notification_settings (`key`, `value`) VALUES
  ('email_enabled',      'false'),
  ('admin_email',        ''),
  ('whatsapp_enabled',   'false'),
  ('whatsapp_phone',     ''),
  ('whatsapp_provider',  'callmebot'),
  ('whatsapp_apikey',    ''),
  ('whatsapp_instance',  ''),
  ('whatsapp_sid',       ''),
  ('whatsapp_secret',    ''),
  ('whatsapp_from',      'whatsapp:+14155238886')
ON DUPLICATE KEY UPDATE `key` = `key`;
