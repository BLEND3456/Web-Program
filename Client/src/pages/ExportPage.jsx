import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exportAPI, projectsAPI } from '../services/api';
import ThemeToggle from '../components/UI/ThemeToggle';

const ExportPage = () => {
  // ИСПРАВЛЕНО: Достаем параметр id, так как в App.js путь прописан как /export/:id
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'generating', 'success', 'error'
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProject = async () => {
      // ЗАЩИТА: не делаем запрос, если id сломан
      if (!id || id === 'undefined') {
        setError('Некорректный ID проекта');
        return;
      }
      try {
        const data = await projectsAPI.getById(id); // Используем id
        setProject(data);
      } catch (err) {
        setError('Проект не найден');
      }
    };
    if (id) loadProject();
  }, [id]);

  const handleGenerate = async () => {
    if (!id || id === 'undefined') {
      setError('Ошибка: ID проекта не найден');
      return;
    }

    setLoading(true);
    setStatus('generating');
    setError('');
    try {
      await exportAPI.generatePDF(id); // Используем id
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Ошибка генерации');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text-secondary flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans transition-colors duration-200">
      <ThemeToggle className="fixed top-6 right-6 z-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <button 
          onClick={() => navigate(`/editor/${id}`)}
          className="mb-8 flex items-center gap-2 text-app-muted hover:text-app-text transition-colors text-sm group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Вернуться в редактор
        </button>

        <div className="bg-app-surface border border-app-border rounded-[2.5rem] p-10 shadow-2xl text-center">
          {/* Иконка экспорта */}
          <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-inner">
            {status === 'success' ? '✅' : '📄'}
          </div>

          <h2 className="text-2xl font-bold text-app-text mb-2">
            Экспорт публикации
          </h2>
          <p className="text-app-muted text-sm mb-8 leading-relaxed">
            {project?.name || 'Загрузка проекта...'} <br/>
            <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              Формат: PDF • {project?.width || '...'}x{project?.height || '...'}px
            </span>
          </p>

          {/* Статусы и Ошибки */}
          {error && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          {status === 'success' && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium">
              Файл успешно сгенерирован и загружен!
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGenerate}
              disabled={loading || !id || id === 'undefined'}
              className={`w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                loading 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.98]'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Генерация макета...
                </div>
              ) : (
                'Подготовить PDF файл'
              )}
            </button>

            {status === 'success' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-4 rounded-2xl font-bold text-sm text-app-muted hover:text-app-text hover:bg-app-hover transition-all"
              >
                На главную
              </button>
            )}
          </div>
        </div>

        {/* Подсказка */}
        <p className="mt-8 text-center text-app-muted text-[11px] leading-relaxed uppercase tracking-wider">
          Генерация может занять до 15 секунд <br/> в зависимости от количества слоев
        </p>
      </div>
    </div>
  );
};

export default ExportPage;