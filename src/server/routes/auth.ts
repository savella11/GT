import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../database.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";
import { sendEmail } from "../mailService.js";

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Gestión de autenticación y usuarios
 */

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "construcciones-elite-secret-key";

/**
 * @swagger
 * /api/register:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Registrar un nuevo usuario (Solo Admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [admin, user], default: user }
 */
router.post("/register", authenticateToken, isAdmin, async (req, res) => {
  const { username, email, password, role = "user" } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    // Usamos consulta directa para manejar el campo email opcional
    const [result]: any = await db.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)", 
      [username, email, hashedPassword, role]
    );

    const insertId = result.insertId;
    res.json({ id: insertId, username, email, role });
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: "El usuario ya existe o error en los datos", details: e.message });
  }
});

/**
 * @swagger
 * /api/login:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`🔑 Intento de login para: ${username}`);

  try {
    const [result]: any = await db.query("CALL sp_GetUserByUsername(?)", [username]);
    console.log("🔍 Resultado DB para login:", JSON.stringify(result));

    if (!result || !result[0] || !result[0][0]) {
      console.log("⚠️ Usuario no encontrado");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = result[0][0];
    console.log("👤 Usuario encontrado:", user.username, "Rol:", user.role);

    if (!user.password) {
      console.log("❌ Error: La base de datos no devolvió el campo password");
      return res.status(500).json({ error: "Error de configuración de usuario" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("⚠️ Contraseña no coincide");
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    console.log("✅ Login exitoso");
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (e: any) {
    console.error("❌ ERROR CRÍTICO EN LOGIN:", e);
    res.status(500).json({ error: "Error interno del servidor", details: e.message });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Listar todos los usuarios (Solo Admin)
 */
router.get("/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [result]: any = await db.query("CALL sp_GetAllUsers()");
    const users = result[0];
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

/**
 * @swagger
 * /api/logout:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Cerrar sesión
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Sesión cerrada" });
});

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Obtener información del usuario autenticado actual
 */
router.get("/me", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.json(null);
  try {
    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch (e) {
    res.json(null);
  }
});

/**
 * @swagger
 * /api/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Solicitar recuperación de contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, description: "Email o nombre de usuario" }
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    // Verificar si el usuario existe (buscando por email o username)
    const [users]: any = await db.query("SELECT id, email FROM users WHERE email = ? OR username = ?", [email, email]);
    
    if (!users || users.length === 0) {
      // Por seguridad, devolvemos el mismo mensaje aunque el usuario no exista
      return res.json({ message: "Si el correo existe, se enviará un enlace de recuperación." });
    }

    const targetEmail = users[0].email || email; // Usar el email registrado o el proporcionado si coincide con username
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hora
    
    // Guardar token en la tabla password_resets
    await db.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)", 
      [targetEmail, token, expiry]
    );
    
    // Intentar enviar email si las variables de entorno están configuradas
    if (process.env.SMTP_USER) {
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      await sendEmail(
        targetEmail, 
        "Recuperación de Contraseña - Construcciones Elite",
        `<h1>Recuperación de Contraseña</h1>
         <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
         <p><a href="${resetUrl}" style="background-color: #1a1a1a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Restablecer Contraseña</a></p>
         <p>O copia y pega este enlace: ${resetUrl}</p>
         <p>Este enlace expirará en 1 hora.</p>`
      );
    } else {
      console.log(`📧 Token de recuperación para ${targetEmail} (Email no configurado): ${token}`);
    }
    
    res.json({ message: "Si el correo existe, se enviará un enlace de recuperación." });
  } catch (error: any) {
    console.error("❌ Error en forgot-password:", error);
    res.status(500).json({ 
      error: "Error de servidor", 
      details: error.message,
      code: error.code 
    });
  }
});

/**
 * @swagger
 * /api/reset-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Restablecer contraseña con token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token: { type: string }
 *               newPassword: { type: string }
 */
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Verificar token y obtener email
    const [rows]: any = await db.query(
      "SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()", 
      [token]
    );

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const email = rows[0].email;

    // Actualizar contraseña del usuario
    await db.query("UPDATE users SET password = ? WHERE email = ? OR username = ?", [hashedPassword, email, email]);
    
    // Eliminar token usado
    await db.query("DELETE FROM password_resets WHERE token = ?", [token]);
    
    res.json({ message: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Token inválido o expirado" });
  }
});

export default router;