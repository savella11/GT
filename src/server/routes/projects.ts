import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../database.js";
import { authenticateToken, isAdmin } from "../middleware/auth.js";

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Gestión de proyectos de construcción
 */

const router = express.Router();
const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

/**
 * @swagger
 * /api/projects:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Listar todos los proyectos
 */
router.get("/", async (req, res) => {
  try {
    const [result]: any = await db.query("CALL sp_GetAllProjects()");
    const projects = result[0].map((p: any) => ({
      ...p,
      images: typeof p.images === "string" ? JSON.parse(p.images) : p.images,
    }));
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Obtener detalles de un proyecto por ID
 */
router.get("/:id", async (req, res) => {
  try {
    const [result]: any = await db.query("CALL sp_GetProjectById(?)", [
      req.params.id,
    ]);
    const project = result[0][0];

    if (project) {
      if (project.images) {
        try {
          project.images = typeof project.images === "string" 
            ? JSON.parse(project.images) 
            : project.images;
        } catch (e) {
          console.error("Error parsing images for project:", project.id, e);
          project.images = [];
        }
      } else {
        project.images = [];
      }
      res.json(project);
    } else {
      res.status(404).json({ error: "Proyecto no encontrado" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error de servidor" });
  }
});

/**
 * @swagger
 * /api/projects:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Crear un nuevo proyecto (Solo Admin)
 */
router.post("/", authenticateToken, isAdmin, async (req, res) => {
  const {
    title,
    title_en,
    description,
    description_en,
    image_url,
    images,
    location,
    category,
  } = req.body;
  try {
    const [result]: any = await db.query(
      "CALL sp_CreateProject(?, ?, ?, ?, ?, ?, ?, ?)",
      [
        title,
        title_en,
        description,
        description_en,
        image_url,
        JSON.stringify(images || []),
        location,
        category,
      ],
    );
    // Asumiendo que el SP devuelve el ID insertado como primer resultado
    const newId = result[0][0]?.id || result[0].insertId;
    res.json({ id: newId, title });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "Error al crear el proyecto" });
  }
});

/**
 * @swagger
 * /api/projects/upload:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Subir archivos de imagen (Solo Admin)
 */
router.post("/upload", authenticateToken, isAdmin, (req, res, next) => {
  upload.array("images")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("❌ Error de Multer:", err);
      return res.status(400).json({ error: `Error de subida: ${err.message}` });
    } else if (err) {
      console.error("❌ Error desconocido en subida:", err);
      return res
        .status(500)
        .json({ error: "Error interno al procesar archivos" });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No se subieron archivos" });
    }

    const paths = files.map((file) => `/uploads/${file.filename}`);
    res.json({ paths });
  });
});

/** 
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     tags:
 *       - Projects
 *     summary: Actualizar un proyecto existente (Admin)
 */
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
  const {
    title,
    title_en,
    description,
    description_en,
    image_url,
    images,
    location,
    category,
  } = req.body;
  
  try {
    // Usamos el mismo SP o uno nuevo. Aquí usaré una consulta directa si el SP no soporta UPDATE
    // pero idealmente deberías tener un sp_UpdateProject
    await db.query(
      "UPDATE projects SET title = ?, title_en = ?, description = ?, description_en = ?, image_url = ?, images = ?, location = ?, category = ? WHERE id = ?",
      [
        title,
        title_en,
        description,
        description_en,
        image_url,
        JSON.stringify(images || []),
        location,
        category,
        req.params.id
      ]
    );
    res.json({ message: "Proyecto actualizado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo actualizar el proyecto" });
  }
});

/** 
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     tags:
 *       - Projects
 *     summary: Eliminar un proyecto (Admin)
 */
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query("CALL sp_delete_project(?)", [req.params.id]);
    res.json({ message: "Proyecto eliminado con éxito" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "No se pudo eliminar el proyecto" });
  }
});

export default router;
