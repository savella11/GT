import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Hammer, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { authService } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Token de recuperación no encontrado.");
      return;
    }

    if (password !== confirmPassword) {
      setError(t('login', 'passwordMismatch') || "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({ token, newPassword: password });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al restablecer la contraseña");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold uppercase tracking-tight">Acceso Inválido</h1>
          <p className="text-gray-500">El enlace de recuperación es inválido o ha expirado.</p>
          <button 
            onClick={() => navigate("/login")}
            className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a] hover:underline"
          >
            Volver al ingreso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border border-[#1a1a1a]/5"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-[#1a1a1a]/50 text-sm uppercase tracking-widest font-medium">
            Ingresa tu nueva clave de acceso
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-6">
            <div className="p-6 bg-green-50 text-green-700 rounded-2xl flex flex-col items-center space-y-3">
              <CheckCircle className="w-10 h-10" />
              <p className="font-medium text-sm">
                ¡Contraseña actualizada con éxito! Redirigiendo al login...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-3 bg-red-50 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 ml-1">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 ml-1">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? "PROCESANDO..." : (
                <>
                  <span>ACTUALIZAR CONTRASEÑA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}