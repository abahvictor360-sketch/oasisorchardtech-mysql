-- Adds Stripe Customer/Subscription tracking for recurring plan billing.
-- Run this once against the live database (phpMyAdmin or `mysql < file`).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255) DEFAULT NULL;
