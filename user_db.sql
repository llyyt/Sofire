USE Sofire;

CREATE TABLE users (
  userid INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入示例数据（注意密码哈希需要重新生成）
INSERT INTO users (email, password_hash, is_admin) VALUES
  ('admin@example.com', '$2b$10$gZ/5oUv7Qy3v2q1Vk8wJf.9dL7TbHj0mN8hY6zXr3vKk1l2sS5W', 1),
  ('user@example.com', '$2b$10$gZ/5oUv7Qy3v2q1Vk8wJf.9dL7TbHj0mN8hY6zXr3vKk1l2sS5W', 0);