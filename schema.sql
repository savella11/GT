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

DELIMITER //

-- 1. Proyectos: Listar todos
CREATE PROCEDURE sp_GetAllProjects()
BEGIN
    SELECT * FROM projects;
END //

-- 2. Proyectos: Obtener por ID
CREATE PROCEDURE sp_GetProjectById(IN p_id INT)
BEGIN
    SELECT * FROM projects WHERE id = p_id;
END //

-- 3. Proyectos: Crear nuevo
CREATE PROCEDURE sp_CreateProject(
    IN p_title VARCHAR(255),
    IN p_title_en VARCHAR(255),
    IN p_description TEXT,
    IN p_description_en TEXT,
    IN p_image_url VARCHAR(255),
    IN p_images JSON,
    IN p_location VARCHAR(255),
    IN p_category VARCHAR(100)
)
BEGIN
    INSERT INTO projects (title, title_en, description, description_en, image_url, images, location, category)
    VALUES (p_title, p_title_en, p_description, p_description_en, p_image_url, p_images, p_location, p_category);
    SELECT LAST_INSERT_ID() AS id;
END //

-- 4. Usuarios: Obtener por nombre (Login)
CREATE PROCEDURE sp_GetUserByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT * FROM users WHERE username = p_username;
END //

-- 4.1 crear usuarios
DELIMITER //

CREATE PROCEDURE sp_CreateUser(
    IN p_username VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(50)
)
BEGIN
    INSERT INTO users (username, password, role) 
    VALUES (p_username, p_password, p_role);
    SELECT LAST_INSERT_ID() AS insertId;
END //

DELIMITER ;
-- consultar usuarios
DELIMITER //

CREATE PROCEDURE sp_GetAllUsers()
BEGIN
    SELECT id, username, role FROM users;
END //

DELIMITER ;


DELIMITER //
-- 5. Comentarios: Listar por proyecto
CREATE PROCEDURE sp_GetCommentsByProject(IN p_project_id INT)
BEGIN
    SELECT c.*, u.username 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.project_id = p_project_id
    ORDER BY c.created_at DESC;
END //
DELIMITER ;

DELIMITER //
-- 6. Comentarios: Crear nuevo
CREATE PROCEDURE sp_CreateComment(
    IN p_user_id INT,
    IN p_project_id INT,
    IN p_content TEXT,
    IN p_rating INT
)
BEGIN
    INSERT INTO comments (user_id, project_id, content, rating)
    VALUES (p_user_id, p_project_id, p_content, p_rating);
    SELECT LAST_INSERT_ID() AS id;
END //

DELIMITER ;

DELIMITER //

-- 1. SP para insertar el comentario
CREATE PROCEDURE sp_InsertComment(
    IN p_user_id INT,
    IN p_project_id INT,
    IN p_content TEXT,
    IN p_rating INT
)
BEGIN
    INSERT INTO comments (user_id, project_id, content, rating) 
    VALUES (p_user_id, p_project_id, p_content, p_rating);
    SELECT LAST_INSERT_ID() AS insertId;
END //

-- 2. SP para obtener el comentario recién creado con el username
CREATE PROCEDURE sp_GetCommentById(IN p_comment_id INT)
BEGIN
    SELECT c.*, u.username 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    WHERE c.id = p_comment_id;
END //

DELIMITER ;


USE elite_construction;

-- 1. Añadimos el campo email a los usuarios (necesario para enviar el correo)
ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE AFTER username;

-- 2. Creamos una tabla para los tokens de recuperación
CREATE TABLE IF NOT EXISTS password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Nota: Tus tablas de proyectos y comentarios ya tienen "ON DELETE CASCADE", 
-- por lo que al borrar un usuario se borran sus comentarios, 
-- y al borrar un proyecto se borran sus comentarios automáticamente.


DELIMITER //

-- Eliminar Proyecto
CREATE PROCEDURE sp_delete_project(IN p_id INT)
BEGIN
    DELETE FROM projects WHERE id = p_id;
END //

-- Eliminar Comentario
CREATE PROCEDURE sp_delete_comment(IN c_id INT)
BEGIN
    DELETE FROM comments WHERE id = c_id;
END //

-- Listar Comentarios para el Administrador
CREATE PROCEDURE sp_get_all_comments()
BEGIN
    SELECT c.*, u.username, p.title as project_title 
    FROM comments c 
    JOIN users u ON c.user_id = u.id 
    JOIN projects p ON c.project_id = p.id
    ORDER BY c.created_at DESC;
END //

DELIMITER ;




DELIMITER //

-- Eliminar Proyecto
CREATE PROCEDURE sp_delete_project(IN p_id INT)
BEGIN
    DELETE FROM projects WHERE id = p_id;
END //

-- Eliminar Comentario
CREATE PROCEDURE sp_delete_comment(IN p_id INT)
BEGIN
    DELETE FROM comments WHERE id = p_id;
END //

-- Listar todos los comentarios (Admin)
CREATE PROCEDURE sp_get_all_comments()
BEGIN
    SELECT c.*, u.username, p.title as project_title 
    FROM comments c
    JOIN users u ON c.user_id = u.id
    JOIN projects p ON c.project_id = p.id
    ORDER BY c.created_at DESC;
END //

-- Guardar token de recuperación
CREATE PROCEDURE sp_SetResetToken(IN p_email VARCHAR(255), IN p_token VARCHAR(255), IN p_expiry DATETIME)
BEGIN
    UPDATE users SET reset_token = p_token, reset_token_expiry = p_expiry WHERE username = p_email OR id = p_email;
END //

-- Resetear contraseña
CREATE PROCEDURE sp_ResetPassword(IN p_token VARCHAR(255), IN p_new_password VARCHAR(255))
BEGIN
    UPDATE users SET password = p_new_password, reset_token = NULL, reset_token_expiry = NULL 
    WHERE reset_token = p_token AND reset_token_expiry > NOW();
END //

DELIMITER ;

