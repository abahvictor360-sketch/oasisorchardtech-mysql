-- ============================================================
-- Oasis Orchard Technologies — MySQL Schema
-- Run this once in your Hostinger MySQL database
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Users (login credentials)
CREATE TABLE IF NOT EXISTS users (
  id           VARCHAR(36)  PRIMARY KEY DEFAULT (UUID()),
  email        VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role         VARCHAR(50)  NOT NULL DEFAULT 'user',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (token-based auth)
CREATE TABLE IF NOT EXISTS sessions (
  token      VARCHAR(64)  PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Profiles (user-facing data)
CREATE TABLE IF NOT EXISTS profiles (
  id             VARCHAR(36)    PRIMARY KEY,
  email          VARCHAR(255)   NOT NULL,
  name           VARCHAR(255)   DEFAULT '',
  phone          VARCHAR(50)    DEFAULT '',
  address        TEXT           DEFAULT '',
  plan           VARCHAR(50)    DEFAULT 'basic',
  role           VARCHAR(50)    DEFAULT 'user',
  status         VARCHAR(50)    DEFAULT 'active',
  wallet_balance DECIMAL(10,2)  DEFAULT 0.00,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id            VARCHAR(100)  PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  sku           VARCHAR(100)  DEFAULT '',
  category      VARCHAR(100)  DEFAULT '',
  price         DECIMAL(10,2) NOT NULL DEFAULT 0,
  original_price DECIMAL(10,2) DEFAULT NULL,
  on_sale       TINYINT(1)    NOT NULL DEFAULT 0,
  stock         INT           NOT NULL DEFAULT 0,
  rating        DECIMAL(3,2)  NOT NULL DEFAULT 0,
  review_count  INT           NOT NULL DEFAULT 0,
  image_url     VARCHAR(500)  DEFAULT '',
  badge         VARCHAR(100)  DEFAULT '',
  short_desc    TEXT          DEFAULT '',
  specs         JSON,
  features      JSON,
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Page content + site settings (all stored here by section_key)
CREATE TABLE IF NOT EXISTS page_content (
  section_key VARCHAR(100) PRIMARY KEY,
  content     JSON         NOT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Wallet transactions
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

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id         INT           AUTO_INCREMENT PRIMARY KEY,
  user_id    VARCHAR(36)   NOT NULL,
  status     VARCHAR(50)   NOT NULL DEFAULT 'pending',
  total      DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INT           AUTO_INCREMENT PRIMARY KEY,
  order_id   INT           NOT NULL,
  product_id VARCHAR(100)  NOT NULL,
  name       VARCHAR(255)  NOT NULL DEFAULT '',
  price      DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity   INT           NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Support tickets
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

-- VoIP
CREATE TABLE IF NOT EXISTS voip_accounts (
  id           INT           AUTO_INCREMENT PRIMARY KEY,
  user_id      VARCHAR(36)   UNIQUE NOT NULL,
  phone_number VARCHAR(50)   DEFAULT NULL,
  voip_credits DECIMAL(10,4) NOT NULL DEFAULT 0,
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

-- ============================================================
-- Seed: default admin user
-- Password: Admin@1234  (CHANGE THIS after first login!)
-- Hash generated with: password_hash('Admin@1234', PASSWORD_BCRYPT)
-- ============================================================
INSERT IGNORE INTO users (id, email, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001',
 'admin@oasisorchard.com',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
 'admin');

INSERT IGNORE INTO profiles (id, email, name, role) VALUES
('00000000-0000-0000-0000-000000000001',
 'admin@oasisorchard.com',
 'Admin',
 'admin');
