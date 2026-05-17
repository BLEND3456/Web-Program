import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';

const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-[#111113]/90 border border-white/5 p-8 rounded-[3rem] w-[400px] shadow-2xl transform animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto text-rose-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2 text-center">Удалить проект?</h2>
        <p className="text-sm text-slate-400 text-center mb-8 px-4 font-medium">Это действие нельзя отменить. Проект исчезнет навсегда.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-4 rounded-2xl font-bold text-[10px] bg-white/5 hover:bg-white/10 text-slate-300 transition-all uppercase tracking-[0.2em]">Отмена</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-4 rounded-2xl font-bold text-[10px] bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)] uppercase tracking-[0.2em]">Удалить</button>
        </div>
      </div>
    </div>
  );
};

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState(null);

  useEffect(() => { 
    const fetchProjects = async () => {
      try {
        const data = await projectsAPI.getAll();
        setProjects(data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProjects(); 
  }, []);

  const openDelete = (e, id) => {
    e.stopPropagation();
    setProjectIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await projectsAPI.delete(projectIdToDelete);
      setProjects(projects.filter(p => p.id !== projectIdToDelete));
      setIsDeleteModalOpen(false);
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      {[1,2,3].map(i => <div key={i} className="aspect-[1.1] bg-white/5 rounded-[3rem] animate-pulse"></div>)}
    </div>
  );

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {projects.map((project) => (
          <div 
            key={project.id}
            onClick={() => navigate(`/editor/${project.id}`)}
            className="group relative bg-[#111113] border border-white/5 rounded-[3rem] p-7 hover:bg-[#161618] hover:border-white/10 transition-all duration-500 cursor-pointer shadow-2xl shadow-black/50"
          >
            {/* ИСПРАВЛЕНО: Теперь здесь выводится реальный эскиз верстки холста */}
            <div className="aspect-[1.1] bg-[#09090b] rounded-[2rem] mb-7 overflow-hidden relative flex items-center justify-center ring-1 ring-white/5 shadow-inner">
               {project.previewUrl ? (
                 <img 
                   src={project.previewUrl} 
                   alt={project.name} 
                   className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                 />
               ) : (
                 <span className="text-5xl opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700">📄</span>
               )}
               
               {/* ОВЕРЛЕЙ КНОПОК ПРИ НАВЕДЕНИИ */}
               <div className="absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/export/${project.id}`); }}
                    className="bg-white text-indigo-950 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                  >
                    Экспорт PDF
                  </button>
                  <button onClick={(e) => openDelete(e, project.id)} className="text-rose-400/60 hover:text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-2">Удалить</button>
               </div>
            </div>
            <div className="px-1">
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors truncate">
                Проект "{project.name || 'Без названия'}"
              </h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Газетный макет</p>
              <p className="text-[10px] font-mono text-slate-600 font-bold tracking-tighter italic mt-1">
                {project.width} x {project.height} PX
              </p>
            </div>
          </div>
        ))}
      </div>

      <DeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />
    </>
  );
};

export default ProjectList;