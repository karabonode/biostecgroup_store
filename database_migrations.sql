-- =====================================================
-- PAYMENT FLOW MIGRATIONS
-- Run with:
--   /c/xampp/mysql/bin/mysql -u root -D biostec_db < database_migrations.sql
-- =====================================================

USE biostec_db;

-- Ensure order_items has grade used by checkout/order-status APIs.
SET @grade_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'order_items'
    AND COLUMN_NAME = 'grade'
);
SET @grade_sql := IF(
  @grade_exists = 0,
  "ALTER TABLE order_items ADD COLUMN grade ENUM('A','B','C') DEFAULT 'A' AFTER total_price",
  "SELECT 'order_items.grade already exists'"
);
PREPARE stmt_grade FROM @grade_sql;
EXECUTE stmt_grade;
DEALLOCATE PREPARE stmt_grade;

-- Add payment transaction audit table used by api/orders/pay.php.
CREATE TABLE IF NOT EXISTS payment_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NULL,
    order_number VARCHAR(50) NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'yoco',
    status ENUM('pending', 'already_paid', 'paid', 'failed') NOT NULL,
    gateway_reference VARCHAR(255) NULL,
    amount INT NULL,
    currency VARCHAR(10) DEFAULT 'ZAR',
    request_payload JSON NULL,
    response_payload JSON NULL,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_pt_order_number (order_number),
    INDEX idx_pt_status (status),
    INDEX idx_pt_provider (provider),
    INDEX idx_pt_created_at (created_at),

    CONSTRAINT fk_payment_transactions_order
      FOREIGN KEY (order_id) REFERENCES orders(id)
      ON DELETE SET NULL
) ENGINE=InnoDB;

-- =====================================================
-- MIGRATION: Add Product Categories
-- Description: Insert additional product categories for batteries, accessories, and chargers
-- Applied: April 15, 2026
-- =====================================================

-- Insert new categories if they don't exist
INSERT IGNORE INTO categories (name, slug, description, icon, sort_order, is_active) VALUES
('Batteries', 'batteries', 'Laptop and device batteries', 'battery', 10, TRUE),
('Chargers', 'chargers', 'Power adapters and chargers', 'zap', 11, TRUE),
('Accessories', 'accessories', 'Laptop accessories and peripherals', 'layers', 12, TRUE);

-- =====================================================
-- CATEGORY EXPANSION MIGRATION (2026-05-17)
-- Adds top-level categories for Laptops, Phones,
-- Processors to match the storefront category grid.
-- =====================================================

INSERT IGNORE INTO categories (name, slug, description, icon, sort_order, is_active) VALUES
('Laptops',    'laptops',    'Refurbished business and consumer laptops', 'laptop',     5,  TRUE),
('Phones',     'phones',     'Refurbished smartphones',                   'smartphone',  6,  TRUE),
('Processors', 'processors', 'CPUs and processors',                       'cpu',         7,  TRUE);

-- =====================================================
-- OTP EMAIL VERIFICATION MIGRATION (2026-05-19)
-- Adds OTP columns to users table for email
-- verification on registration.
-- =====================================================

-- Run only once; columns already applied 2026-05-19
ALTER TABLE users
  ADD COLUMN otp_hash       VARCHAR(255) NULL,
  ADD COLUMN otp_expires_at DATETIME     NULL,
  ADD COLUMN otp_sent_at    DATETIME     NULL;

-- =====================================================
-- DEFAULT ADMIN USER SEED (2026-05-24)
-- Ensures a verified, active admin account exists.
-- Email: admin@biostecgroup.co.za
-- Password: Biostecgroup@4922
-- =====================================================

INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  email_verified,
  is_active,
  verification_token,
  otp_hash,
  otp_expires_at,
  otp_sent_at
) VALUES (
  'admin@biostecgroup.co.za',
  '$2y$12$3ELnct3YFFiYjX0LgnfGOO6dItHm0NNLuI7l5QccSwRW569vwGWtK',
  'Admin',
  'User',
  'admin',
  1,
  1,
  NULL,
  NULL,
  NULL,
  NULL
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  first_name = VALUES(first_name),
  last_name = VALUES(last_name),
  role = 'admin',
  email_verified = 1,
  is_active = 1,
  verification_token = NULL,
  otp_hash = NULL,
  otp_expires_at = NULL,
  otp_sent_at = NULL;
