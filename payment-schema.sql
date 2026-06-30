-- ============================================================
-- Payment Schema — Oasis Orchard Technologies
-- Run AFTER mysql-schema.sql in phpMyAdmin
-- ============================================================

SET NAMES utf8mb4;

-- ── Orders ───────────────────────────────────────────────────
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user    ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);

-- ── Order items ───────────────────────────────────────────────
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

-- ── Payment transactions ──────────────────────────────────────
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

-- ── Payment gateway settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_settings (
  `key`      VARCHAR(100) NOT NULL,
  `value`    TEXT         NOT NULL DEFAULT '',
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
);

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
