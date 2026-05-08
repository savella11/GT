import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, ArrowRight } from "lucide-react";
import { Project } from "../types";
import { useLanguage } from "../contexts/LanguageContext";
import { projectService } from "../services/api";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectService.getAll();
        setProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a1a1a]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="relative h-[70vh] flex items-center overflow-hidden rounded-3xl">
        <img 
          src="../uploads/fondogeneral.webp" 
          alt="Construcción" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] to-transparent opacity-80"></div>
        <div className="relative z-10 max-w-2xl px-8 md:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#5A5A40] font-bold uppercase tracking-[0.3em] text-xs mb-4 block">{t('home', 'heroSubtitle')}</span>
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6 tracking-tighter">
              {t('home', 'heroTitle1')} <br /> {t('home', 'heroTitle2')}
            </h1>
            <p className="text-[#f5f2ed]/80 text-lg mb-8 max-w-md">
              {t('home', 'heroDesc')}
            </p>
            <a href="#proyectos" className="inline-flex items-center space-x-3 bg-white text-[#1a1a1a] px-8 py-4 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#5A5A40] hover:text-white transition-all group">
              <span>{t('home', 'viewProjects')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="proyectos" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <h2 className="text-4xl font-bold tracking-tighter uppercase mb-2">{t('home', 'ourWork')}</h2>
            <p className="text-[#1a1a1a]/60 max-w-md">{t('home', 'ourWorkDesc')}</p>
          </div>
          <div className="flex space-x-4">
            <span className="px-4 py-2 bg-[#1a1a1a] text-white rounded-full text-xs font-bold uppercase tracking-widest">{t('home', 'all')}</span>
            <span className="px-4 py-2 border border-[#1a1a1a]/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a1a]/5 cursor-pointer transition-colors">{t('home', 'residential')}</span>
            <span className="px-4 py-2 border border-[#1a1a1a]/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[#1a1a1a]/5 cursor-pointer transition-colors">{t('home', 'commercial')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/project/${project.id}`} className="group block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6">
                  <img 
                    src={project.image_url} 
                    alt={project.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {/* @ts-ignore */}
                      {language === 'en' ? t('home', project.category.toLowerCase()) || project.category : project.category}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight group-hover:text-[#5A5A40] transition-colors">
                      {/* @ts-ignore */}
                      {language === 'en' && project.title_en ? project.title_en : project.title}
                    </h3>
                    <div className="flex items-center text-[#1a1a1a]/50 text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{project.location}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 border border-[#1a1a1a]/10 rounded-full flex items-center justify-center group-hover:bg-[#1a1a1a] group-hover:text-white transition-all">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-[#1a1a1a] rounded-3xl p-12 md:p-20 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-5xl font-bold mb-2 tracking-tighter">250+</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('home', 'statsCompleted')}</div>
          </div>
          <div>
            <div className="text-5xl font-bold mb-2 tracking-tighter">15+</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('home', 'statsExperience')}</div>
          </div>
          <div>
            <div className="text-5xl font-bold mb-2 tracking-tighter">50+</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('home', 'statsTeam')}</div>
          </div>
          <div>
            <div className="text-5xl font-bold mb-2 tracking-tighter">100%</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">{t('home', 'statsClients')}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
