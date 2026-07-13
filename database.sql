-- ================================================================
-- Oasis Orchard Technologies — COMPLETE DATABASE
-- One-file import: tables + admin account + products + settings
--
-- HOW TO USE:
--   1. In Hostinger hPanel → phpMyAdmin, select your database
--   2. Import this single file — done.
--
-- ADMIN LOGIN:
--   Email    : info@oasisorchardtech.com
--   Password : (set by owner — bcrypt hash below)
-- ================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

-- ════════════════════════════════════════════════════════════════
-- 1. AUTH & USERS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  token      VARCHAR(64)  PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS profiles (
  id             VARCHAR(36)    PRIMARY KEY,
  email          VARCHAR(255)   NOT NULL,
  name           VARCHAR(255)   DEFAULT '',
  phone          VARCHAR(50)    DEFAULT '',
  address        TEXT,
  plan           VARCHAR(50)    DEFAULT 'basic',
  role           VARCHAR(50)    DEFAULT 'user',
  status         VARCHAR(50)    DEFAULT 'active',
  wallet_balance DECIMAL(10,2)  DEFAULT 0.00,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Failed login attempts (rate limiting: 5 fails / 15 min per email+IP)
CREATE TABLE IF NOT EXISTS login_attempts (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  ip           VARCHAR(64)  NOT NULL DEFAULT '',
  attempted_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_attempts (email, ip, attempted_at)
);

-- ════════════════════════════════════════════════════════════════
-- 2. PRODUCTS & CONTENT
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS products (
  id             VARCHAR(100)  PRIMARY KEY,
  name           VARCHAR(255)  NOT NULL,
  sku            VARCHAR(100)  DEFAULT '',
  category       VARCHAR(100)  DEFAULT '',
  price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2) DEFAULT NULL,
  on_sale        TINYINT(1)    NOT NULL DEFAULT 0,
  stock          INT           NOT NULL DEFAULT 0,
  rating         DECIMAL(3,2)  NOT NULL DEFAULT 0,
  review_count   INT           NOT NULL DEFAULT 0,
  image_url      VARCHAR(500)  DEFAULT '',
  badge          VARCHAR(100)  DEFAULT '',
  short_desc     TEXT,
  specs          JSON,
  features       JSON,
  is_active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Page content + site settings (stored as JSON by section_key)
CREATE TABLE IF NOT EXISTS page_content (
  section_key VARCHAR(100) PRIMARY KEY,
  content     JSON         NOT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════
-- 3. WALLET
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(36)   NOT NULL,
  description   VARCHAR(255)  DEFAULT '',
  amount        DECIMAL(10,2) NOT NULL,
  type          VARCHAR(20)   NOT NULL DEFAULT 'credit',
  balance_after DECIMAL(10,2) DEFAULT 0,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════════════════════════
-- 4. ORDERS & PAYMENTS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS orders (
  id               VARCHAR(36)   NOT NULL PRIMARY KEY,
  user_id          VARCHAR(36)   DEFAULT NULL,
  status           VARCHAR(50)   NOT NULL DEFAULT 'pending',
  payment_method   VARCHAR(50)   NOT NULL DEFAULT 'stripe',
  payment_status   VARCHAR(50)   NOT NULL DEFAULT 'pending',
  stripe_intent_id VARCHAR(255)  DEFAULT NULL,
  paypal_order_id  VARCHAR(255)  DEFAULT NULL,
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_cost    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax              DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  shipping_name    VARCHAR(255)  NOT NULL DEFAULT '',
  shipping_email   VARCHAR(255)  NOT NULL DEFAULT '',
  shipping_phone   VARCHAR(100)  NOT NULL DEFAULT '',
  shipping_street  TEXT,
  shipping_city    VARCHAR(100)  NOT NULL DEFAULT '',
  shipping_state   VARCHAR(100)  NOT NULL DEFAULT '',
  shipping_zip     VARCHAR(20)   NOT NULL DEFAULT '',
  shipping_country VARCHAR(100)  NOT NULL DEFAULT 'Canada',
  notes            TEXT,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_orders_user    (user_id),
  INDEX idx_orders_status  (status),
  INDEX idx_orders_created (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id            INT           AUTO_INCREMENT PRIMARY KEY,
  order_id      VARCHAR(36)   NOT NULL,
  product_id    VARCHAR(100)  DEFAULT NULL,
  product_name  VARCHAR(255)  NOT NULL DEFAULT '',
  product_image VARCHAR(500)  DEFAULT '',
  quantity      INT           NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_price   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id              INT           AUTO_INCREMENT PRIMARY KEY,
  order_id        VARCHAR(36)   NOT NULL,
  provider        VARCHAR(50)   NOT NULL,
  provider_txn_id VARCHAR(255)  DEFAULT NULL,
  amount          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency        VARCHAR(10)   NOT NULL DEFAULT 'CAD',
  status          VARCHAR(50)   NOT NULL DEFAULT 'pending',
  raw_response    JSON,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`    TEXT         NOT NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════
-- 5. NOTIFICATIONS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS notification_settings (
  `key`      VARCHAR(100) NOT NULL PRIMARY KEY,
  `value`    TEXT         NOT NULL,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ════════════════════════════════════════════════════════════════
-- 6. SUPPORT TICKETS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS support_tickets (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  subject    VARCHAR(255) NOT NULL DEFAULT '',
  status     VARCHAR(50)  NOT NULL DEFAULT 'open',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  ticket_id   INT          NOT NULL,
  sender_id   VARCHAR(36)  NOT NULL,
  sender_name VARCHAR(255) DEFAULT '',
  message     TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- ════════════════════════════════════════════════════════════════
-- 7. PHONE CALLS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS voip_accounts (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(36)   UNIQUE NOT NULL,
  phone_number VARCHAR(50)   DEFAULT NULL,
  voip_credits DECIMAL(10,4) NOT NULL DEFAULT 0,
  voip_enabled TINYINT(1)    NOT NULL DEFAULT 1,
  sip_username VARCHAR(100)  DEFAULT NULL,
  sip_password VARCHAR(100)  DEFAULT NULL,
  sip_server   VARCHAR(100)  DEFAULT NULL,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS voip_calls (
  id               INT           AUTO_INCREMENT PRIMARY KEY,
  user_id          VARCHAR(36)   NOT NULL,
  direction        VARCHAR(20)   NOT NULL DEFAULT 'outbound',
  from_number      VARCHAR(50)   DEFAULT '',
  to_number        VARCHAR(50)   DEFAULT '',
  status           VARCHAR(30)   NOT NULL DEFAULT 'initiated',
  duration_seconds INT           DEFAULT 0,
  cost             DECIMAL(10,4) DEFAULT 0,
  started_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at         TIMESTAMP     NULL DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS voip_settings (
  `key`   VARCHAR(100) PRIMARY KEY,
  `value` JSON         NOT NULL
);

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- SEED DATA
-- ================================================================

-- ── Admin account ──
INSERT INTO users (id, email, password_hash, role) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'info@oasisorchardtech.com',
  '$2b$10$rviEai3bko2g34BAa5dTaOE8cKVaJkSad6bjAFMtJwEX0CpYIuIFW',
  'admin'
)
ON DUPLICATE KEY UPDATE
  role          = 'admin',
  password_hash = '$2b$10$n4IHmMRFGS/nD/yfxHxI4.ud8ZLDgidVAbBB9kvhkFtqfw5dyYhfu';

INSERT INTO profiles (id, email, name, plan, role, status) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'info@oasisorchardtech.com',
  'Site Admin',
  'business',
  'admin',
  'active'
)
ON DUPLICATE KEY UPDATE name = 'Site Admin', role = 'admin', status = 'active';

-- ── Products ──────────────────────────────────────────────────
INSERT INTO products (id, name, sku, category, price, original_price, on_sale, stock, rating, review_count, image_url, badge, short_desc, specs, features, is_active) VALUES
('grwp810', 'Grandstream GRWP810', 'WP810', 'mobile', 140.00, 150.00, 1, 12, 4.30, 18, '/images/GRWP810.png', 'Sale',
 'Cordless WiFi phone with 1.8" color TFT LCD, 3.5mm headset jack, AC adapter included.',
 '{"display":"1.8 inch color TFT LCD","connectivity":"WiFi","headsetJack":"3.5mm","powerSupply":"AC adapter included","lines":1}',
 '["Cordless WiFi operation","HD voice quality","1.8 inch color TFT LCD display","3.5mm headset jack","AC power adapter included"]', 1),

('grwp816', 'Grandstream GRWP816', 'WP816', 'mobile', 115.00, 120.00, 1, 8, 4.50, 24, '/images/GRWP816.png', 'Sale',
 'Cordless WiFi 6 phone with 3-way conferencing, HD audio, 6hr talk-time, 1500mAh battery.',
 '{"display":"Color LCD","connectivity":"WiFi 6","battery":"1500mAh","talkTime":"6 hours","standbyTime":"120 hours","conferencing":"3-way voice","codec":"Opus HD"}',
 '["WiFi 6 connectivity","3-way voice conferencing","Opus HD voice codec","6 hours talk-time","120 hours standby","1500mAh battery"]', 1),

('grwp820', 'Grandstream GRWP820', 'WP820', 'mobile', 240.00, 270.00, 1, 5, 4.60, 31, '/images/GRWP820.png', 'Sale',
 'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
 '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
 '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]', 1),

('grwp822', 'Grandstream GRWP822', 'WP822', 'mobile', 165.00, 200.00, 1, 9, 4.40, 22, '/images/GRWP822.png', 'Sale',
 'wireless phone WiFi 802.11 a/b/g/n, 2 lines, 2.4" TFT LCD, HD audio, Bluetooth, Android 7.0.',
 '{"display":"2.4 inch colour TFT LCD","connectivity":"WiFi 802.11 a/b/g/n","lines":2,"bluetooth":true,"battery":"Li-ion","os":"Android 7.0","audio":"HD audio"}',
 '["2 SIP lines","WiFi 802.11 a/b/g/n","HD audio quality","Bluetooth connectivity","Android 7.0 OS","2.4 inch colour TFT LCD","Li-ion rechargeable battery"]', 1),

('grwp825', 'Grandstream GRWP825', 'WP825', 'mobile', 220.00, 270.00, 1, 6, 4.70, 19, '/images/GRWP825.png', 'Sale',
 'Business wireless phone, 2 lines, 2.4" TFT LCD, HD audio, USB port, 3.5mm jack, Bluetooth, rechargeable.',
 '{"display":"2.4 inch colour TFT LCD","lines":2,"usb":true,"headsetJack":"3.5mm","bluetooth":true,"battery":"Rechargeable Li-ion","audio":"HD audio"}',
 '["2 SIP lines","HD audio quality","USB port","3.5mm headset jack","Integrated Bluetooth","2.4 inch colour TFT LCD","Rechargeable battery"]', 1),

('grwp826', 'Grandstream GRWP826', 'WP826', 'mobile', 150.00, 170.00, 1, 14, 4.80, 27, '/images/GRWP826.png', 'Sale',
 'Cordless WiFi 6 phone, 4-way conferencing, 12hr talk-time, 240hr standby, 3000mAh battery.',
 '{"connectivity":"WiFi 6","conferencing":"4-way voice","codec":"Opus HD","talkTime":"12 hours","standbyTime":"240 hours","battery":"3000mAh"}',
 '["WiFi 6 connectivity","4-way voice conferencing","Opus HD voice codec","12 hours talk-time","240 hours standby","3000mAh high-capacity battery"]', 1),

('grgrp2602w', 'Grandstream GRGRP2602W', 'GRP2602W', 'home-phone', 80.00, 110.00, 1, 20, 4.50, 35, '/images/GRGRP2602W.png', 'Sale',
 'Business IP WiFi 802.11 a/b/g/n/ac desktop phone, 2 lines, 2.21" LCD, HD audio, EHS headset support.',
 '{"display":"2.21 inch LCD","connectivity":"WiFi 802.11 a/b/g/n/ac (2.4GHz & 5GHz)","ethernet":"2x Fast Ethernet","lines":2,"lineKeys":2,"audio":"HD audio","headset":"RJ9 jack, EHS support (Jabra & Plantronics)","power":"AC adapter included (no PoE)","provisioning":"Grandstream GDMS cloud","warranty":"1-year standard (extendable to 3 years)"}',
 '["WiFi 802.11 a/b/g/n/ac dual-band","2 SIP lines / 2 line keys","2x Fast Ethernet ports","HD audio quality","RJ9 headset jack with EHS support","GDMS cloud provisioning compatible","Optional wall mount bracket","1-year manufacturer warranty"]', 1)

ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ── Payment gateway defaults ──────────────────────────────────
INSERT INTO payment_settings (`key`, `value`) VALUES
  ('stripe_enabled',         'false'),
  ('stripe_publishable_key', ''),
  ('stripe_secret_key',      ''),
  ('stripe_webhook_secret',  ''),
  ('paypal_enabled',         'false'),
  ('paypal_client_id',       ''),
  ('paypal_client_secret',   ''),
  ('paypal_mode',            'sandbox'),
  ('currency',               'CAD')
ON DUPLICATE KEY UPDATE `key` = `key`;

-- ── Notification defaults ─────────────────────────────────────
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
