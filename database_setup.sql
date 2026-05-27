-- Create database
CREATE DATABASE IF NOT EXISTS biostec_db;
USE biostec_db;

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create laptops table with all required fields
CREATE TABLE IF NOT EXISTS laptops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    specs TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    grade VARCHAR(10) DEFAULT 'A',
    stock INT DEFAULT 10,
    rating DECIMAL(3, 1) DEFAULT 4.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample laptops
INSERT INTO laptops (name, description, specs, image, price, grade, stock, rating) VALUES
('Lenovo ThinkPad T480', 
 'The gold standard for business productivity. Durable, powerful, and reliable. Features Intel 8th Gen processor, excellent keyboard, and all-day battery life.', 
 '{"cpu": "Intel i5 8th Gen", "ram": "8GB DDR4", "storage": "256GB SSD"}', 
 'https://picsum.photos/seed/t480/800/600', 
 4500.00, 'A', 10, 4.8),

('Dell Latitude 7490', 
 'Premium business ultrabook with a stunning display and exceptional build quality. Perfect for professionals on the go.', 
 '{"cpu": "Intel i5 8th Gen", "ram": "16GB DDR4", "storage": "256GB SSD"}', 
 'https://picsum.photos/seed/7490/800/600', 
 4200.00, 'A', 5, 4.7),

('HP EliteBook 840 G5', 
 'Sleek aluminum design with enterprise-grade security features. Refurbished to like-new condition.', 
 '{"cpu": "Intel i5 8th Gen", "ram": "8GB DDR4", "storage": "256GB SSD"}', 
 'https://picsum.photos/seed/840g5/800/600', 
 3800.00, 'B', 8, 4.5),

('MacBook Pro 13" 2017', 
 'Powerful performance in a thin and light design. Perfect for creative professionals and developers.', 
 '{"cpu": "Intel i5 Dual Core", "ram": "8GB DDR3", "storage": "128GB SSD"}', 
 'https://picsum.photos/seed/mbp/800/600', 
 6500.00, 'A', 3, 4.9),

('Dell XPS 13 9370', 
 'Stunning InfinityEdge display in a compact form factor. Premium ultrabook for demanding users.', 
 '{"cpu": "Intel i7 8th Gen", "ram": "16GB DDR4", "storage": "512GB SSD"}', 
 'https://picsum.photos/seed/xps13/800/600', 
 5800.00, 'A', 7, 4.8),

('Lenovo ThinkPad X1 Carbon', 
 'Ultralight business laptop with legendary ThinkPad reliability and performance.', 
 '{"cpu": "Intel i7 8th Gen", "ram": "16GB DDR4", "storage": "512GB SSD"}', 
 'https://picsum.photos/seed/x1carbon/800/600', 
 6200.00, 'A', 4, 4.9);
