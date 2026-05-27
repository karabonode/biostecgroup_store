-- =====================================================
-- BIOSTEC GROUP DATABASE SCHEMA
-- Improved with Security, Audit Trail, and Better Flow
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS biostec_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE biostec_db;

-- =====================================================
-- 1. USERS TABLE (For customers)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role ENUM('customer', 'admin') DEFAULT 'customer',
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB;

-- =====================================================
-- 2. USER ADDRESSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    address_type ENUM('shipping', 'billing') DEFAULT 'shipping',
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'South Africa',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- =====================================================
-- 3. CATEGORIES TABLE (For better organization)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
('Business Laptops', 'business-laptops', 'Professional business-grade laptops', 'laptop', 1),
('Ultrabooks', 'ultrabooks', 'Lightweight and portable laptops', 'feather', 2),
('Workstations', 'workstations', 'High-performance workstations', 'cpu', 3),
('MacBooks', 'macbooks', 'Apple MacBook lineup', 'apple', 4);

-- =====================================================
-- 4. PRODUCTS/LAPTOPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id INT,
    
    -- Pricing (in cents to avoid floating point issues)
    price INT NOT NULL,
    compare_at_price INT,
    cost_price INT,
    
    -- Specifications (JSON for flexibility)
    specs JSON,
    
    -- Images (JSON array of URLs)
    images JSON,
    featured_image VARCHAR(500),
    
    -- Inventory
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    track_inventory BOOLEAN DEFAULT TRUE,
    
    -- Condition
    grade ENUM('A', 'B', 'C') DEFAULT 'A',
    condition_notes TEXT,
    
    -- Metadata
    brand VARCHAR(100),
    model VARCHAR(100),
    year_manufactured INT,
    serial_number VARCHAR(100),
    
    -- SEO & Marketing
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    tags JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Ratings
    rating DECIMAL(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_sku (sku),
    INDEX idx_slug (slug),
    INDEX idx_category (category_id),
    INDEX idx_price (price),
    INDEX idx_stock (stock_quantity),
    INDEX idx_grade (grade),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    FULLTEXT INDEX idx_search (name, description)
) ENGINE=InnoDB;

-- =====================================================
-- 5. INVENTORY LOGS (Audit trail for stock changes)
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT,
    change_type ENUM('add', 'remove', 'adjust', 'sale', 'return') NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    quantity_changed INT NOT NULL,
    reference_type ENUM('order', 'manual', 'system') DEFAULT 'manual',
    reference_id INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- 6. ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    
    -- Order Status
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded') DEFAULT 'pending',
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    
    -- Pricing
    subtotal INT NOT NULL,
    shipping_cost INT DEFAULT 0,
    tax_amount INT DEFAULT 0,
    discount_amount INT DEFAULT 0,
    total_amount INT NOT NULL,
    
    -- Shipping
    shipping_address_id INT,
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- Customer Info (snapshot at time of order)
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    shipping_address JSON,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    paid_at TIMESTAMP NULL,
    
    -- Notes
    customer_notes TEXT,
    admin_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- 7. ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT,
    
    -- Product snapshot at time of order
    product_name VARCHAR(255) NOT NULL,
    product_sku VARCHAR(50),
    product_image VARCHAR(500),
    
    -- Pricing
    unit_price INT NOT NULL,
    quantity INT NOT NULL,
    total_price INT NOT NULL,
    
    -- Specifications at time of order
    specs_snapshot JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
    INDEX idx_order (order_id),
    INDEX idx_product (product_id)
) ENGINE=InnoDB;

-- =====================================================
-- 8. REPAIR TICKETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS repair_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT,
    
    -- Customer Info
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Device Info
    device_type ENUM('laptop', 'desktop', 'tablet', 'phone', 'other') DEFAULT 'laptop',
    device_brand VARCHAR(100),
    device_model VARCHAR(255) NOT NULL,
    device_serial VARCHAR(100),
    
    -- Issue Details
    issue_description TEXT NOT NULL,
    issue_category ENUM('hardware', 'software', 'virus', 'screen', 'battery', 'keyboard', 'other') DEFAULT 'other',
    
    -- Status & Priority
    status ENUM('pending', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    
    -- Pricing
    estimated_cost INT,
    final_cost INT,
    deposit_amount INT DEFAULT 0,
    
    -- Timestamps
    diagnosed_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    -- Notes
    technician_notes TEXT,
    customer_notes TEXT,
    internal_notes TEXT,
    
    assigned_technician_id INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ticket_number (ticket_number),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- 9. ADMIN ACTIVITY LOG (Security Audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- =====================================================
-- 10. SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_key (setting_key)
) ENGINE=InnoDB;

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'Biostec Group', 'string', 'Website name'),
('site_email', 'info@biostecgroup.co.za', 'string', 'Contact email'),
('currency', 'ZAR', 'string', 'Default currency'),
('currency_symbol', 'R', 'string', 'Currency symbol'),
('tax_rate', '15', 'number', 'Tax percentage'),
('free_shipping_threshold', '500000', 'number', 'Free shipping threshold in cents (R5000)'),
('low_stock_alert', '5', 'number', 'Low stock threshold'),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status');

-- =====================================================
-- 11. DEFAULT ADMIN USER SEED
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
    verification_token
) VALUES (
    'admin@biostecgroup.co.za',
    '$2y$12$3ELnct3YFFiYjX0LgnfGOO6dItHm0NNLuI7l5QccSwRW569vwGWtK',
    'Admin',
    'User',
    'admin',
    1,
    1,
    NULL
)
ON DUPLICATE KEY UPDATE
    password_hash = VALUES(password_hash),
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    role = 'admin',
    email_verified = 1,
    is_active = 1,
    verification_token = NULL;

-- Create indexes for better performance
CREATE INDEX idx_products_active_grade ON products(is_active, grade);
CREATE INDEX idx_products_price_stock ON products(price, stock_quantity);
CREATE INDEX idx_orders_status_payment ON orders(status, payment_status);
