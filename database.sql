-- 先创建数据库并选中
CREATE DATABASE IF NOT EXISTS Sofire;
USE Sofire;

-- 创建分类表
CREATE TABLE categories (
  catid INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
);

-- 创建产品表
CREATE TABLE products (
  pid INT AUTO_INCREMENT PRIMARY KEY,
  catid INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catid) REFERENCES categories(catid)
);

-- 插入示例数据
INSERT INTO categories (name) VALUES 
  ('Food'),
  ('Cookware');

INSERT INTO products (catid, name, price, description) VALUES
  (1, 'Oreo Cookies', 9.60, 'Family Size 19.1 oz'),
  (1, 'Snack Mix', 5.99, 'Variety Pack 20oz'),
  (2, 'Nonstick Cookware Set', 86.99, '14 Pcs Kitchen Set'),
  (2, 'Stainless Steel Pot', 45.99, '3 Quart Capacity');