import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { MapPin, Star, MessageSquare, Send, ArrowLeft, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Project, Comment } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { projectService } from "../services/api";

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [projData, commData] = await Promise.all([
          projectService.getById(id),
          projectService.getComments(id)
        ]);
        
        setProject(projData);
        setComments(commData);
      } catch (error) {
        console.error("Failed to fetch project details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    setSubmitting(true);
    try {
      const addedComment = await projectService.addComment(id, { content: newComment, rating });
      setComments([addedComment, ...comments]);
      setNewComment("");
      setRating(5);
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1a1a]"></div></div>;
  if (!project) return <div>{t('project', 'notFound')}</div>;

  const allImages = project.images && project.images.length > 0 ? project.images : [project.image_url];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <Link to="/" className="inline-flex items-center space-x-2 text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/40 hover:text-[#1a1a1a] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>{t('project', 'back')}</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl group">
            <img 
              src={allImages[currentImageIndex]} 
              alt={`${project.title} - ${t('project', 'image')} ${currentImageIndex + 1}`} 
              className="w-full h-full object-cover transition-opacity duration-500"
              referrerPolicy="no-referrer"
            />
            
            {allImages.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={prevImage}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {allImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? "bg-white w-6" : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <span className="text-[#5A5A40] font-bold uppercase tracking-[0.3em] text-xs mb-4 block">
            {/* @ts-ignore */}
            {language === 'en' ? t('home', project.category.toLowerCase()) || project.category : project.category}
          </span>
          <h1 className="text-5xl font-bold tracking-tighter uppercase mb-6 leading-none">
            {/* @ts-ignore */}
            {language === 'en' && project.title_en ? project.title_en : project.title}
          </h1>
          <div className="flex items-center text-[#1a1a1a]/60 mb-8">
            <MapPin className="w-5 h-5 mr-2 text-[#5A5A40]" />
            <span className="text-lg">{project.location}</span>
          </div>
          <p className="text-lg text-[#1a1a1a]/70 leading-relaxed mb-10">
            {/* @ts-ignore */}
            {language === 'en' && project.description_en ? project.description_en : project.description}
          </p>
          
          <div className="grid grid-cols-2 gap-6 border-t border-[#1a1a1a]/10 pt-10">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 mb-1">{t('project', 'client')}</div>
              <div className="font-bold">{t('project', 'confidential')}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[#1a1a1a]/40 mb-1">{t('project', 'year')}</div>
              <div className="font-bold">2025</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Comments Section */}
      <section className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-6 h-6 text-[#5A5A40]" />
            <h2 className="text-3xl font-bold tracking-tighter uppercase">{t('project', 'testimonials')}</h2>
          </div>
          <div className="text-sm font-bold uppercase tracking-widest text-[#1a1a1a]/40">
            {comments.length} {t('project', 'comments')}
          </div>
        </div>

        {/* Comment Form */}
        <div className="mb-16">
          {user ? (
            <form onSubmit={handleSubmitComment} className="space-y-6 bg-[#f5f2ed]/50 p-8 rounded-2xl">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-[#1a1a1a] rounded-full flex items-center justify-center text-white">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold uppercase tracking-widest">{user.username}</div>
                  <div className="text-[10px] text-[#1a1a1a]/40 uppercase tracking-widest">{t('project', 'postAsClient')}</div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('project', 'rating')}</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      className={`p-1 transition-colors ${s <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('project', 'yourComment')}</label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t('project', 'placeholder')}
                  className="w-full bg-white border border-[#1a1a1a]/10 rounded-xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full md:w-auto bg-[#1a1a1a] text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {submitting ? <span>{t('project', 'sending')}</span> : (
                  <>
                    <span>{t('project', 'postTestimonial')}</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-[#1a1a1a] text-white p-10 rounded-2xl text-center">
              <h3 className="text-xl font-bold uppercase tracking-widest mb-4">{t('project', 'wereYouPart')}</h3>
              <p className="text-white/60 mb-8 max-w-md mx-auto">{t('project', 'onlyClients')}</p>
              <Link to="/login" className="inline-block bg-white text-[#1a1a1a] px-8 py-3 rounded-full font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] hover:text-white transition-all">
                {t('project', 'loginToRate')}
              </Link>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="space-y-8">
          {comments.length > 0 ? comments.map((comment) => (
            <div key={comment.id} className="border-b border-[#1a1a1a]/5 pb-8 last:border-0">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#f5f2ed] rounded-full flex items-center justify-center text-[#1a1a1a]/40">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm uppercase tracking-widest">{comment.username}</div>
                    <div className="text-[10px] text-[#1a1a1a]/40 uppercase tracking-widest">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex text-yellow-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < comment.rating ? 'fill-current' : 'text-gray-200'}`} />
                  ))}
                </div>
              </div>
              <p className="text-[#1a1a1a]/70 leading-relaxed italic">
                "{comment.content}"
              </p>
            </div>
          )) : (
            <div className="text-center py-12 text-[#1a1a1a]/30 uppercase tracking-widest text-sm">
              {t('project', 'noTestimonials')}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
