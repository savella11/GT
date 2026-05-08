import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserPlus, Users, Shield, AlertCircle, CheckCircle, PlusCircle, Image as ImageIcon, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import { User as UserType } from "../types";
import { authService, projectService } from "../services/api";

export default function Admin() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState<UserType[]>([]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allComments, setAllComments] = useState<any[]>([]);
  const [editingProject, setEditingProject] = useState<any | null>(null);

  // Project state
  const [projectTitle, setProjectTitle] = useState("");
  const [projectTitleEn, setProjectTitleEn] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectDescEn, setProjectDescEn] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectCategory, setProjectCategory] = useState("Residencial");
  const [projectImages, setProjectImages] = useState<(File | string | null)[]>([null]);
  const [projectError, setProjectError] = useState("");
  const [projectSuccess, setProjectSuccess] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers();
      fetchProjects();
      fetchComments();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      const data = await projectService.getAll();
      setAllProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchComments = async () => {
    try {
      const data = await projectService.adminGetComments();
      setAllComments(data);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    }
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    setProjectTitle(project.title);
    setProjectTitleEn(project.title_en || "");
    setProjectDesc(project.description);
    setProjectDescEn(project.description_en || "");
    setProjectLocation(project.location);
    setProjectCategory(project.category);
    setProjectImages(project.images || [project.image_url]);
    window.scrollTo({ top: document.getElementById('project-form')?.offsetTop || 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProject(null);
    setProjectTitle("");
    setProjectTitleEn("");
    setProjectDesc("");
    setProjectDescEn("");
    setProjectLocation("");
    setProjectCategory("Residencial");
    setProjectImages([null]);
  };

  const handleDeleteProject = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este proyecto?")) return;
    try {
      await projectService.delete(id);
      fetchProjects();
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const handleDeleteComment = async (id: number) => {
    if (!window.confirm("¿Estás seguro de eliminar este comentario?")) return;
    try {
      await projectService.deleteComment(id);
      fetchComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await authService.register({ username, email, password, role });
      setSuccess(`${t('admin', 'userCreated')} (${username})`);
      setUsername("");
      setEmail("");
      setPassword("");
      fetchUsers();
    } catch (err: any) {
      setError(err.message || t('admin', 'userCreateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    setProjectImages([...projectImages, null]);
  };

  const handleImageChange = (index: number, val: File | string | null) => {
    const newImages = [...projectImages];
    newImages[index] = val;
    setProjectImages(newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = projectImages.filter((_, i) => i !== index);
    if (newImages.length === 0) newImages.push(null);
    setProjectImages(newImages);
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProjectError("");
    setProjectSuccess("");
    setProjectLoading(true);

    try {
      let finalPaths: string[] = [];
      const newFiles = projectImages.filter((img): img is File => img instanceof File);
      const existingPaths = projectImages.filter((img): img is string => typeof img === 'string');

      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach(file => formData.append("images", file));

        const uploadRes = await fetch("/api/projects/upload", {
          method: "POST",
          body: formData
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || "Error al subir imágenes");
        }

        const { paths } = await uploadRes.json();
        finalPaths = [...existingPaths, ...paths];
      } else {
        finalPaths = existingPaths;
      }

      if (finalPaths.length === 0) {
        throw new Error(t('admin', 'imgRequired'));
      }

      const payload = {
        title: projectTitle,
        title_en: projectTitleEn,
        description: projectDesc,
        description_en: projectDescEn,
        location: projectLocation,
        category: projectCategory,
        image_url: finalPaths[0],
        images: finalPaths
      };

      if (editingProject) {
        // Asumiendo que existirá una ruta PUT en el backend
        await fetch(`/api/projects/${editingProject.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setProjectSuccess(`${t('admin', 'projectUpdated')} (${projectTitle})`);
      } else {
        await projectService.create(payload);
        setProjectSuccess(`${t('admin', 'projectCreated')} (${projectTitle})`);
      }

      cancelEdit();
      fetchProjects();
    } catch (err: any) {
      setProjectError(err.message || t('admin', 'connError'));
    } finally {
      setProjectLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold uppercase tracking-tighter">{t('admin', 'accessDenied')}</h1>
          <p className="text-[#1a1a1a]/50">{t('admin', 'onlyAdmins')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter uppercase mb-2">{t('admin', 'title')}</h1>
          <p className="text-[#1a1a1a]/60">{t('admin', 'subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Create User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
            <div className="flex items-center space-x-3 mb-8">
              <UserPlus className="w-6 h-6 text-[#5A5A40]" />
              <h2 className="text-xl font-bold tracking-tighter uppercase">{t('admin', 'createUser')}</h2>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-50 text-green-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'username')}</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                  placeholder="ejemplo@correo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'role')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                >
                  <option value="user">{t('admin', 'roleUser')}</option>
                  <option value="admin">{t('admin', 'roleAdmin')}</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1a1a] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all disabled:opacity-50"
              >
                {loading ? t('admin', 'creating') : t('admin', 'createUser')}
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
            <div className="flex items-center space-x-3 mb-8">
              <Users className="w-6 h-6 text-[#5A5A40]" />
              <h2 className="text-xl font-bold tracking-tighter uppercase">{t('admin', 'existingUsers')}</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1a1a1a]/5">
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">ID</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">{t('admin', 'username')}</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">{t('admin', 'email')}</th>
                    <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">{t('admin', 'role')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#1a1a1a]/5 last:border-0 hover:bg-[#f5f2ed]/20">
                      <td className="py-4 text-sm font-mono text-[#1a1a1a]/40">{u.id}</td>
                      <td className="py-4 font-bold">{u.username}</td>
                      <td className="py-4 text-xs italic text-[#1a1a1a]/60">{u.email || '-'}</td>
                      <td className="py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex items-center space-x-3 mb-8">
          <PlusCircle className="w-6 h-6 text-[#5A5A40]" />
          <h2 className="text-xl font-bold tracking-tighter uppercase">Gestión de Proyectos</h2>
        </div>

        <div className="overflow-x-auto mb-10">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a1a1a]/5">
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">ID</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Título</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Categoría</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allProjects.map((p) => (
                <tr key={p.id} className="border-b border-[#1a1a1a]/5 last:border-0 hover:bg-[#f5f2ed]/20 transition-colors">
                  <td className="py-4 text-sm font-mono text-[#1a1a1a]/40">{p.id}</td>
                  <td className="py-4 font-bold">{p.title}</td>
                  <td className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{p.category}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleEditProject(p)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-xl transition-colors mr-2"
                    >
                      <PlusCircle className="w-5 h-5 rotate-45" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create/Edit Project Form */}
        <div id="project-form" className="mt-12 pt-12 border-t border-[#1a1a1a]/5">
          <h3 className="text-lg font-bold tracking-tighter uppercase mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5" />
              <span>{editingProject ? 'Editar Proyecto' : 'Nuevos Proyectos'}</span>
            </div>
            {editingProject && (
              <button 
                onClick={cancelEdit}
                className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
              >
                Cancelar Edición
              </button>
            )}
          </h3>
          <form onSubmit={handleProjectSubmit} className="space-y-6">
            {projectError && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{projectError}</span>
              </div>
            )}
            {projectSuccess && (
              <div className="p-4 bg-green-50 text-green-600 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>{projectSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'projectTitle')}</label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'projectTitleEn')}</label>
                <input
                  type="text"
                  value={projectTitleEn}
                  onChange={(e) => setProjectTitleEn(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'location')}</label>
                <input
                  type="text"
                  value={projectLocation}
                  onChange={(e) => setProjectLocation(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'category')}</label>
                <select
                  value={projectCategory}
                  onChange={(e) => setProjectCategory(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <option value="Residencial">{t('home', 'residential')}</option>
                  <option value="Comercial">{t('home', 'commercial')}</option>
                  <option value="Infraestructura">{t('home', 'infrastructure')}</option>
                  <option value="Oficinas">{t('home', 'offices')}</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'description')}</label>
                <textarea
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all min-h-[100px] font-medium"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60">{t('admin', 'descriptionEn')}</label>
                <textarea
                  value={projectDescEn}
                  onChange={(e) => setProjectDescEn(e.target.value)}
                  className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all min-h-[100px] font-medium"
                />
              </div>

              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/60 flex items-center justify-between">
                  <span>{t('admin', 'images')}</span>
                  <button 
                    type="button" 
                    onClick={handleAddImage}
                    className="text-[#5A5A40] hover:text-[#1a1a1a] flex items-center space-x-1"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>{t('admin', 'addImage')}</span>
                  </button>
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {projectImages.map((img, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a1a]/30" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageChange(index, e.target.files ? e.target.files[0] : null)}
                          className="w-full bg-[#f5f2ed]/50 border border-[#1a1a1a]/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all text-xs"
                          required={index === 0}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={projectLoading}
                className="bg-[#1a1a1a] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5A5A40] transition-all disabled:opacity-50"
              >
                {projectLoading ? t('admin', 'creating') : t('admin', 'createProjectBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#1a1a1a]/5">
        <div className="flex items-center space-x-3 mb-8">
          <CheckCircle className="w-6 h-6 text-[#5A5A40]" />
          <h2 className="text-xl font-bold tracking-tighter uppercase">Moderación de Comentarios</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1a1a1a]/5">
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Usuario</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Comentario</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40">Calificación</th>
                <th className="py-4 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]/40 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allComments.map((c) => (
                <tr key={c.id} className="border-b border-[#1a1a1a]/5 last:border-0 hover:bg-[#f5f2ed]/20 transition-colors">
                  <td className="py-4 font-bold">{c.username}</td>
                  <td className="py-4 text-sm max-w-xs truncate">{c.content}</td>
                  <td className="py-4">
                    <span className="text-yellow-500 font-bold">{c.rating}★</span>
                  </td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {allComments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#1a1a1a]/40 italic text-sm">
                    No hay comentarios registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}