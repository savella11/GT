import express from "express";
import { db } from "../database.js";
import { authenticateToken, AuthRequest, isAdmin } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Gestión de comentarios y valoraciones de proyectos
 */

/**
 * @swagger
 * /api/comments/project/{projectId}:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Obtener comentarios de un proyecto
 */
router.get("/project/:projectId", async (req, res) => {
  try {
    const [result]: any = await db.query("CALL sp_GetCommentsByProject(?)", [
      req.params.projectId,
    ]);
    res.json(result[0] || []);
  } catch (e) {
    console.error("❌ Error al obtener comentarios:", e);
    res.status(500).json({ error: "Error al obtener los comentarios" });
  }
});

/**
 * @swagger
 * /api/comments/project/{projectId}:
 *   post:
 *     tags:
 *       - Comments
 *     summary: Publicar un comentario en un proyecto
 */
router.post("/project/:projectId", authenticateToken, async (req: AuthRequest, res) => {
  const { content, rating } = req.body;
  const projectId = req.params.projectId;
  const userId = req.user?.id;

  if (!userId) return res.status(401).json({ error: "No autorizado" });

  try {
    const [insertResult]: any = await db.query(
      "CALL sp_InsertComment(?, ?, ?, ?)",
      [userId, projectId, content, rating]
    );
    
    const insertId = insertResult[0][0]?.insertId || insertResult[0][0]?.id;

    const [commentResult]: any = await db.query(
      "CALL sp_GetCommentById(?)",
      [insertId]
    );

    res.json(commentResult[0][0]);
  } catch (e) {
    console.error("❌ Error al crear comentario:", e);
    res.status(400).json({ error: "Error al crear el comentario" });
  }
});

/**
 * @swagger
 * /api/comments/all:
 *   get:
 *     tags:
 *       - Comments
 *     summary: Listar todos los comentarios (Solo Admin)
 */
router.get("/all", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows]: any = await db.query("CALL sp_get_all_comments()");
    res.json(rows[0] || []);
  } catch (error) {
    console.error("❌ Error al obtener todos los comentarios:", error);
    res.status(500).json({ error: "Error al obtener comentarios" });
  }
});

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags:
 *       - Comments
 *     summary: Eliminar un comentario (Solo Admin)
 */
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query("CALL sp_delete_comment(?)", [req.params.id]);
    res.json({ message: "Comentario eliminado con éxito" });
  } catch (error) {
    console.error("❌ Error al eliminar comentario:", error);
    res.status(500).json({ error: "Error al eliminar el comentario" });
  }
});

export default router;
