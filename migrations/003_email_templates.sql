-- Migration 003: Add email_templates table
-- Run this on your existing database (via phpMyAdmin) if upgrading.
-- Fresh installs already have this table from database.sql.

CREATE TABLE IF NOT EXISTS email_templates (
  id         VARCHAR(80)  NOT NULL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  body_html  LONGTEXT     NOT NULL,
  variables  TEXT         DEFAULT NULL,
  is_active  TINYINT(1)   NOT NULL DEFAULT 1,
  is_system  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Default templates are seeded automatically by PHP on first visit to Admin → Email Templates.
