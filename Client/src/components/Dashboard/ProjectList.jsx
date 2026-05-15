import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsAPI } from '../../services/api';

const ProjectList = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Получение списка проектов из БД
      const data = await projectsAPI.getAll();
      setProjects(data);
    } catch (err) {
      setError('Не удалось загрузить проекты. Проверьте соединение с сервером.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('Удалить этот проект навсегда?')) {
      try {
        await projectsAPI.delete(id); // Удаление через API
        setProjects(projects.filter(p => p._id !== id));
      } catch (err) {
        alert('Ошибка при удалении проекта');
      }
    }
  };

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-slate-800 rounded-3xl"></div>)}
    </div>
  );

  if (error) return <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-center">{error}</div>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
      {projects.map((project) => (
        <div 
          key={project._id} 
          onClick={() => navigate(`/editor/${project._id}`)} // Переход в редактор
          className="group cursor-pointer"
        >
          <div className="aspect-[3/4] bg-slate-800 rounded-[2rem] border border-slate-700 group-hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden shadow-2xl shadow-black/40">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
            
            {/* Иконка-заглушка вместо превью */}
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-4xl opacity-20 group-hover:scale-110 transition-transform duration-500">📄</span>
            </div>

            {/* Быстрые действия */}
            <div className="absolute inset-0 bg-indigo-900/20 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
              <button 
                onClick={(e) => { e.stopPropagation(); navigate(`/export/${project._id}`); }}
                className="bg-white text-indigo-950 px-6 py-2.5 rounded-full text-xs font-bold shadow-xl hover:scale-105 transition-transform"
              >
                ЭКСПОРТ PDF
              </button>
              <button 
                onClick={(e) => handleDelete(e, project._id)}
                className="text-white/60 hover:text-rose-400 text-[10px] font-bold tracking-widest uppercase"
              >
                Удалить
              </button>
            </div>
          </div>

          <div className="mt-5 px-2">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
              {project.name || 'Без названия'}
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">
              {project.width} x {project.height} px
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectList;