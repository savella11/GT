import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

// Create the connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "elite_construction",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function initDb() {
  try {
    const connection = await db.getConnection();
    console.log("✅ Conectado a MySQL");

    // Create tables
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user'
      )
    `);

    // Ensure email column exists if table was already created
    try {
      await connection.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE AFTER username");
      console.log("✅ Columna 'email' añadida a 'users'");
    } catch (e: any) {
      // Ignore if column already exists
      if (!e.message.includes("Duplicate column name")) {
        console.error("⚠️ Error al intentar añadir columna email:", e.message);
      }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at DATETIME NOT NULL,
        INDEX(email),
        INDEX(token)
      )
    `);

    // Ensure email column exists in password_resets if table was already created differently
    try {
      const [cols]: any = await connection.query("SHOW COLUMNS FROM password_resets LIKE 'email'");
      if (cols.length === 0) {
        await connection.query("ALTER TABLE password_resets ADD COLUMN email VARCHAR(255) NOT NULL FIRST");
        console.log("✅ Columna 'email' añadida a 'password_resets'");
      }
      
      // Remove user_id if it exists to avoid ER_NO_DEFAULT_FOR_FIELD
      const [userIdCol]: any = await connection.query("SHOW COLUMNS FROM password_resets LIKE 'user_id'");
      if (userIdCol.length > 0) {
        // Primero intentamos eliminar la restricción de clave foránea
        try {
          await connection.query("ALTER TABLE password_resets DROP FOREIGN KEY password_resets_ibfk_1");
        } catch (fkError) {
          // Si falla por el nombre, intentamos buscar otras posibles restricciones o simplemente ignoramos
        }
        await connection.query("ALTER TABLE password_resets DROP COLUMN user_id");
        console.log("✅ Columna 'user_id' eliminada de 'password_resets'");
      }
    } catch (e: any) {
      console.error("⚠️ Error al verificar columnas en password_resets:", e.message);
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        title_en VARCHAR(255),
        description TEXT,
        description_en TEXT,
        image_url TEXT,
        images JSON,
        location VARCHAR(255),
        category VARCHAR(100)
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        project_id INT,
        content TEXT,
        rating INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Seed Admin
    const [admins]: any = await connection.query("SELECT * FROM users WHERE role = 'admin'");
    if (admins.length === 0) {
      const hashedAdminPassword = bcrypt.hashSync("admin123", 10);
      await connection.query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ["admin", hashedAdminPassword, "admin"]);
      console.log("👤 Admin creado: admin / admin123");
    }

    // Seed Projects
    const [projectsCount]: any = await connection.query("SELECT COUNT(*) as count FROM projects");
    if (projectsCount[0].count === 0) {
      const insertQuery = "INSERT INTO projects (title, description, image_url, images, location, category) VALUES (?, ?, ?, ?, ?, ?)";
      await connection.query(insertQuery, ["Residencial Los Olivos", "Construcción integral de complejo habitacional moderno.", "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80", JSON.stringify(["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80"]), "Madrid, España", "Residencial"]);
      await connection.query(insertQuery, ["Centro Comercial Altura", "Estructura metálica y acabados de lujo para zona comercial.", "https://images.unsplash.com/photo-1555633514-abcee6ad93e1?auto=format&fit=crop&w=800&q=80", JSON.stringify(["https://images.unsplash.com/photo-1555633514-abcee6ad93e1?auto=format&fit=crop&w=800&q=80"]), "Barcelona, España", "Comercial"]);
      console.log("🏗️ Proyectos iniciales creados");
    }

    connection.release();
  } catch (error) {
    console.error("❌ Error conectando a MySQL o inicializando tablas:", error);
  }
}
