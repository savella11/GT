import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { specs } from "./src/server/swagger.js";
import { initDb } from "./src/server/database.js";
import authRoutes from "./src/server/routes/auth.js";
import projectRoutes from "./src/server/routes/projects.js";
import commentRoutes from "./src/server/routes/comments.js";
import adminRoutes from "./src/server/routes/admin.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Database
  await initDb();

  // Basic security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Permitir que Vite cargue scripts en desarrollo
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || true, // En desarrollo permite todos, en prod deberías poner tu dominio
    credentials: true
  }));

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(cookieParser());
  
  // Request logger for debugging
  app.use("/api", (req, res, next) => {
    console.log(`📡 [${req.method}] ${req.url}`);
    next();
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // API Documentation (Swagger)
  app.use(["/doc", "/api-docs"], swaggerUi.serve, swaggerUi.setup(specs));

  // API Routes
  app.use("/api/projects", projectRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api", authRoutes);

  // Catch-all for /api routes to prevent returning HTML
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();