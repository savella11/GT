import express from "express";
import { db } from "../database.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

const router = express.Router();

// Listar todos los comentarios para el admin usando Procedimiento Almacenado
router.get("/comments", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows]: any = await db.query("CALL sp_admin_list_comments()");
    // Los procedimientos almacenados en mysql2 devuelven los resultados en el primer índice del array
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al listar comentarios admin:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// Eliminar un comentario usando Procedimiento Almacenado
router.delete("/comments/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query("CALL sp_delete_comment(?)", [req.params.id]);
    res.json({ message: "Comentario eliminado" });
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

export default router;
