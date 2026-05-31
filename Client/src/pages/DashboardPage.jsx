import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectList from '../components/Dashboard/ProjectList';
import ThemeToggle from '../components/UI/ThemeToggle';
import { projectsAPI } from '../services/api';
import { Plus, FolderArchive, LogOut, Newspaper } from 'lucide-react';

const NEW_DOCUMENT_PRESETS = [
  { id: 'a3-150', name: 'A3 (Таблоид)', sub: '150 DPI', w: 1754, h: 2480, desc: '29.7 × 42 см' },
  { id: 'a3-200', name: 'A3', sub: '200 DPI', w: 2339, h: 3307, desc: '29.7 × 42 см' },
  { id: 'tabloid-us', name: 'Таблоид (US)', sub: '150 DPI', w: 1650, h: 2550, desc: '11 × 17 дюймов' },
  { id: 'berliner', name: 'Берлинер', sub: '150 DPI', w: 1890, h: 2776, desc: '32 × 47 см' },
  { id: 'a2', name: 'A2 (Большой формат)', sub: '150 DPI', w: 2480, h: 3508, desc: '42 × 59.4 см' },
];

const CreateFileModal = ({ isOpen, onClose, onConfirm }) => {
  const [selected, setSelected] = useState(NEW_DOCUMENT_PRESETS[0]);
  const [name, setName] = useState('Без названия-1');
  const [isPortrait, setIsPortrait] = useState(true);

  if (!isOpen) return null;

  const handleCreate = () => {
    const finalW = isPortrait ? selected.w : selected.h;
    const finalH = isPortrait ? selected.h : selected.w;
    onConfirm({ name, width: finalW, height: finalH });
  };

  return (
    <div className="fixed inset-0 bg-app-overlay backdrop-blur-xl flex items-center justify-center z-[200] animate-in fade-in duration-300">
      <div className="bg-app-surface border border-app-border rounded-[3rem] w-[1000px] h-[700px] flex overflow-hidden shadow-2xl transform animate-in zoom-in-95">
        <div className="flex-1 flex flex-col border-r border-app-border bg-app-elevated/50">
          <div className="p-10 pb-6 overflow-y-auto custom-scrollbar">
            <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-8">Библиотека форматов</h2>
            <div className="grid grid-cols-2 gap-4">
              {NEW_DOCUMENT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`flex flex-col items-center p-6 rounded-3xl border transition-all duration-300 ${
                    selected.id === p.id
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-xl'
                      : 'bg-app-hover border-app-border hover:bg-app-hover-strong'
                  }`}
                >
                  <div className={`w-10 h-14 border-2 mb-4 rounded-sm transition-colors ${selected.id === p.id ? 'border-indigo-400 bg-indigo-400/20' : 'border-slate-300 dark:border-slate-700'}`} />
                  <span className="text-xs font-bold text-app-text mb-1">{p.name}</span>
                  <span className="text-[9px] font-bold text-app-muted uppercase">{p.sub} • {p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[340px] p-10 flex flex-col bg-app-surface">
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-10">Детали пресета</h2>
          <div className="space-y-8 flex-1">
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-app-border-strong py-2 text-lg font-bold text-app-text outline-none focus:border-indigo-500 transition-all" />
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[9px] font-bold text-app-muted uppercase mb-2 block">Ширина</label><div className="bg-app-hover rounded-xl p-3 text-sm text-app-text-secondary">{isPortrait ? selected.w : selected.h} px</div></div>
              <div><label className="text-[9px] font-bold text-app-muted uppercase mb-2 block">Высота</label><div className="bg-app-hover rounded-xl p-3 text-sm text-app-text-secondary">{isPortrait ? selected.h : selected.w} px</div></div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-app-muted uppercase mb-3 block text-center">Ориентация</label>
              <div className="flex gap-2">
                <button onClick={() => setIsPortrait(true)} className={`flex-1 p-3 rounded-xl border flex items-center justify-center transition-all ${isPortrait ? 'bg-indigo-600/20 border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'bg-app-hover border-transparent opacity-60'}`}><span className="text-[10px] font-bold uppercase">Книжная</span></button>
                <button onClick={() => setIsPortrait(false)} className={`flex-1 p-3 rounded-xl border flex items-center justify-center transition-all ${!isPortrait ? 'bg-indigo-600/20 border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'bg-app-hover border-transparent opacity-60'}`}><span className="text-[10px] font-bold uppercase">Альбомная</span></button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-6">
            <button onClick={onClose} className="flex-1 py-4 font-bold text-[10px] uppercase text-app-muted hover:text-app-text transition-all">Закрыть</button>
            <button onClick={handleCreate} className="flex-[1.5] py-4 rounded-2xl font-bold text-[10px] uppercase bg-indigo-600 text-white shadow-xl hover:bg-indigo-500 transition-all">Создать</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState(null);

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
  const handleConfirmCreate = async (data) => {
    setCreateError(null);
    try {
      const newProject = await projectsAPI.create(data);
      navigate(`/editor/${newProject.id}`);
    } catch (err) {
      setCreateError(err.message || 'Не удалось создать проект');
    }
  };

  return (
    <div className="h-screen bg-app-bg text-app-text-secondary flex overflow-hidden font-sans transition-colors duration-200">
      <aside className="w-72 border-r border-app-border bg-app-bg flex flex-col p-8 shrink-0 z-20">
        <div className="mb-12 pl-2">
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-2xl font-serif font-bold text-app-text tracking-tighter italic">NEWS EDIT</h2>
            <ThemeToggle />
          </div>
          <div className="w-14 h-14 bg-app-hover rounded-2xl flex items-center justify-center border border-app-border shadow-inner text-indigo-500 dark:text-indigo-400">
            <Newspaper className="w-6 h-6" strokeWidth={1.5} />
          </div>
        </div>

        <nav className="flex-1 space-y-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-bold text-[10px] tracking-[0.1em] flex items-center justify-center gap-2.5 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.25)] uppercase mb-10"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Создать файл
          </button>

          <button className="w-full flex items-center gap-4 p-4 rounded-2xl bg-app-hover text-app-text font-bold text-[10px] tracking-[0.2em] border border-app-border transition-all opacity-90 hover:opacity-100">
            <FolderArchive className="w-4 h-4 text-app-muted" strokeWidth={2} /> БИБЛИОТЕКА
          </button>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 p-4 rounded-2xl hover:bg-app-hover text-app-muted hover:text-app-text font-bold text-[10px] tracking-[0.2em] transition-all uppercase group"
        >
          <LogOut className="w-4 h-4 group-hover:text-rose-500 transition-colors" strokeWidth={2} /> Выйти
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative bg-app-bg">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-600/20 blur-[130px] rounded-full -mr-32 -mt-32 pointer-events-none" />

        <div className="max-w-[1400px] mx-auto p-12">
          <header className="mb-14">
            <h1 className="text-4xl font-bold text-app-text mb-3 tracking-tight">Ваши проекты</h1>
            <p className="text-app-muted font-medium text-sm">Управляйте своими газетными макетами и публикациями</p>
          </header>
          <ProjectList />
        </div>
      </main>

      {createError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 text-sm font-medium">
          {createError}
        </div>
      )}

      <CreateFileModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateError(null); }}
        onConfirm={handleConfirmCreate}
      />
    </div>
  );
};

export default DashboardPage;
