import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Hammer, User, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { authService } from "../services/api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }
  }, [user, navigate]);

  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverSuccess, setRecoverSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: any = await authService.login({ username, password });
      setUser(data);
      
      // Redirigir según el rol
      if (data.role === 'admin') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || t('login', 'invalidCreds'));
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authService.forgotPassword(recoverEmail);
      setRecoverSuccess(true);
    } catch (err: any) {
      setError(err.message || t('login', 'connError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-10 shadow-2xl border border-[#1a1a1a]/5"
      >
        <AnimatePresence mode="wait">
          {!showRecover ? (
            <motion.div
              key="login-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Hammer className="text-white w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">
                  {t('login', 'welcome')}
                </h1>
                <p className="text-[#1a1a1a]/50 text-sm uppercase tracking-widest font-medium">
                  {t('login', 'enterCreds')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-3 bg-red-50 text-red-600 mb-4"
                    >
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 ml-1">{t('login', 'username')}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                      placeholder={t('login', 'username')}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('login', 'password')}</label>
                    <button 
                      type="button"
                      onClick={() => setShowRecover(true)}
                      className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40] hover:text-[#1a1a1a] transition-colors leading-none"
                    >
                      {t('login', 'forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all flex items-center justify-center space-x-2 group active:scale-95 disabled:opacity-50"
                >
                  {loading ? <span>{t('login', 'loading')}</span> : (
                    <>
                      <span>{t('login', 'loginBtn')}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="recover-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-[#5A5A40]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="text-[#5A5A40] w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold tracking-tighter uppercase mb-2">
                  {t('login', 'recoverTitle')}
                </h1>
                <p className="text-[#1a1a1a]/50 text-sm uppercase tracking-widest font-medium">
                  {t('login', 'recoverDesc')}
                </p>
              </div>

              {recoverSuccess ? (
                <div className="text-center space-y-6">
                  <div className="p-6 bg-green-50 text-green-700 rounded-2xl text-sm font-medium">
                    {t('login', 'successRecover')}
                  </div>
                  <button
                    onClick={() => {
                      setShowRecover(false);
                      setRecoverSuccess(false);
                    }}
                    className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a] hover:underline"
                  >
                    {t('login', 'backToLogin')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRecover} className="space-y-6">
                  {error && (
                    <div className="p-4 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-3 bg-red-50 text-red-600 mb-4">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 ml-1">Email / Usuario</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                      <input
                        type="text"
                        value={recoverEmail}
                        onChange={(e) => setRecoverEmail(e.target.value)}
                        className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                        placeholder="tu@email.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? t('login', 'loading') : t('login', 'sendInstructions')}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowRecover(false)}
                      className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors"
                    >
                      {t('login', 'backToLogin')}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 pt-8 border-t border-[#1a1a1a]/5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">
            {t('login', 'contactAdmin')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}