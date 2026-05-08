import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Hammer, LogIn, LogOut, User, Menu, X, Settings, Globe, MapPin } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#1a1a1a]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center group-hover:bg-[#5A5A40] transition-colors">
                <Hammer className="text-white w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tighter uppercase">Elite</span>
                <span className="block text-[10px] tracking-[0.2em] font-medium text-[#1a1a1a]/60 uppercase -mt-1">Construcciones</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-sm font-medium hover:text-[#5A5A40] transition-colors uppercase tracking-widest">{t('nav', 'projects')}</Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="flex items-center space-x-2 text-sm font-medium text-[#5A5A40] hover:text-[#1a1a1a] transition-colors uppercase tracking-widest">
                  <Settings className="w-4 h-4" />
                  <span>{t('nav', 'admin')}</span>
                </Link>
              )}
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm font-medium text-[#1a1a1a]/70">
                    <User className="w-4 h-4" />
                    <span>{user.username}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors uppercase tracking-widest"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav', 'logout')}</span>
                  </button>
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center space-x-2 bg-[#1a1a1a] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#5A5A40] transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('nav', 'login')}</span>
                </Link>
              )}
              
              {/* Language Toggle */}
              <div className="flex items-center space-x-2 border-l border-[#1a1a1a]/10 pl-6">
                <Globe className="w-4 h-4 text-[#1a1a1a]/60" />
                <button 
                  onClick={() => setLanguage('es')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${language === 'es' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70'}`}
                >
                  ES
                </button>
                <span className="text-[#1a1a1a]/20">/</span>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${language === 'en' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40 hover:text-[#1a1a1a]/70'}`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setLanguage('es')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${language === 'es' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'}`}
                >
                  ES
                </button>
                <span className="text-[#1a1a1a]/20">/</span>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${language === 'en' ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]/40'}`}
                >
                  EN
                </button>
              </div>
              <button className="p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-[#1a1a1a]/10 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">{t('nav', 'projects')}</Link>
                {user?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-[#5A5A40]">{t('nav', 'admin')}</Link>
                )}
                {user ? (
                  <>
                    <div className="text-sm text-[#1a1a1a]/60">{t('nav', 'hello')}{user.username}</div>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="block text-red-600 font-medium">{t('nav', 'logout')}</button>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block font-medium">{t('nav', 'login')}</Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a1a1a] text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Hammer className="text-white w-8 h-8" />
                <span className="text-2xl font-bold tracking-tighter uppercase">Elite</span>
              </div>
              <p className="text-[#f5f2ed]/60 text-sm leading-relaxed max-w-xs">
                {t('footer', 'desc')}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-[#f5f2ed]/40">{t('footer', 'contact')}</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center space-x-3 text-[#f5f2ed]/80">
                  <MapPin className="w-4 h-4 text-[#5A5A40]" />
                  <span>{t('footer', 'address')}</span>
                </li>
                <li className="text-[#f5f2ed]/80">+34 912 345 678</li>
                <li className="text-[#f5f2ed]/80">contacto@construccioneselite.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 text-[#f5f2ed]/40">{t('footer', 'hours')}</h4>
              <ul className="space-y-2 text-sm text-[#f5f2ed]/80">
                <li>{t('footer', 'weekdays')}</li>
                <li>{t('footer', 'saturday')}</li>
                <li>{t('footer', 'sunday')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-16 pt-8 text-center text-[10px] uppercase tracking-widest text-[#f5f2ed]/30">
            © 2026 Construcciones Elite. {t('footer', 'rights')}
          </div>
        </div>
      </footer>
    </div>
  );
};
