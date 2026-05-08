import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { MainLayout } from "./components/Layout/MainLayout";

export default function App() {
  useEffect(() => {
    // Solo aplicar bloqueos en producción para no molestar al desarrollar
    if (process.env.NODE_ENV === 'production') {
      const handleContextMenu = (e: MouseEvent) => e.preventDefault();
      const handleKeyDown = (e: KeyboardEvent) => {
        // Bloquear F12
        if (e.key === 'F12') e.preventDefault();
        // Bloquear Ctrl+Shift+I (Inspeccionar)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) e.preventDefault();
        // Bloquear Ctrl+U (Ver código fuente)
        if (e.ctrlKey && e.key === 'u') e.preventDefault();
      };

      document.addEventListener("contextmenu", handleContextMenu);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("contextmenu", handleContextMenu);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, []);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/project/:id" element={<ProjectDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </MainLayout>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}
