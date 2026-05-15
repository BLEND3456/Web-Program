import { useNavigate } from 'react-router-dom';
import ProjectList from '../components/Dashboard/ProjectList';
import { projectsAPI } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleNewProject = async () => {
    try {
      // Используем API для создания нового проекта
      const newProject = await projectsAPI.create({
        name: 'Новый выпуск',
        width: 800,
        height: 1000,
        designSettings: {}
      });
      // Переход в редактор созданного проекта
      navigate(`/editor/${newProject._id}`);
    } catch (err) {
      console.error('Ошибка при создании проекта:', err);
      alert('Не удалось создать новый проект');
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex font-sans">
      {/* Сайдбар в стиле современных графических редакторов */}
      <aside className="w-64 flex-shrink-0 flex flex-col p-6 border-r border-slate-800 bg-[#0f172a] z-10">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
            📰
          </div>
          <span className="font-bold text-lg tracking-tight text-white">NEWS EDIT</span>
        </div>

        <div className="space-y-3 mb-10">
          <button 
            onClick={handleNewProject}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all text-sm shadow-md shadow-indigo-900/40"
          >
            + Создать файл
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <button className="w-full flex items-center gap-3 bg-slate-800 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Библиотека
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-slate-400 hover:text-white hover:bg-slate-800 px-4 py-3 rounded-xl text-sm transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Выйти
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#0b0f1a]">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="flex-1 overflow-y-auto px-12 pb-12 z-10">
          <div className="max-w-6xl mx-auto pt-16">
            <header className="flex justify-between items-end mb-12">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">Ваши проекты</h1>
                <p className="text-slate-400">Управляйте своими газетными макетами и публикациями</p>
              </div>
            </header>
            <ProjectList />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;