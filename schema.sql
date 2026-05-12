CREATE DATABASE IF NOT EXISTS elite_construction;
USE elite_construction;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user'
);

-- Tabla de Proyectos
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  title_en VARCHAR(255),
  description TEXT,
  description_en TEXT,
  image_url VARCHAR(255),
  images JSON, -- MySQL soporta JSON nativo
  location VARCHAR(255),
  category VARCHAR(100)
);

-- Tabla de Comentarios
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  project_id INT,
  content TEXT,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Insertar admin inicial (la contraseña es 'admin123' hasheada)
INSERT IGNORE INTO users (username, password, role) 
VALUES ('admin', '$2a$10$7v6NlYfPz1D1Gz.v9K3mOe.6v9Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z6Z', 'admin');