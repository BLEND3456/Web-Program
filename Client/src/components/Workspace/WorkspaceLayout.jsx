import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Toolbar from './Toolbar';
import CanvasView from './CanvasView';
import PropertyPanel from './PropertyPanel';
import LayersPanel from './LayersPanel';
import { projectsAPI, designPresetsAPI } from '../../services/api';

const WorkspaceInner = () => {
  const { presetId } = useParams();
  const navigate = useNavigate();
  const { canvas } = useWorkspace();
  
  // Состояния из оригинального кода
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState('properties'); 
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  
  // Состояния для работы с проектом
  const [isSaving, setIsSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Загрузка...');

  // 1. Загрузка данных проекта при старте
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const data = await projectsAPI.getById(presetId);
        setProjectTitle(data.name || 'Без названия');
      } catch (err) {
        console.error('Ошибка загрузки метаданных:', err);
        setProjectTitle('Проект не найден');
      }
    };
    if (presetId) fetchMeta();
  }, [presetId]);

  // 2. Ограничение перемещения объектов (Fabric.js)
  useEffect(() => {
    if (!canvas) return;

    const enforceBoundaries = (e) => {
      const obj = e.target;
      if (!obj) return;

      obj.setCoords();
      const bounds = obj.getBoundingRect();

      let newLeft = obj.left;
      let newTop = obj.top;

      if (bounds.left < 0) newLeft -= bounds.left;
      if (bounds.top < 0) newTop -= bounds.top;
      if (bounds.left + bounds.width > canvas.width) {
        newLeft -= (bounds.left + bounds.width - canvas.width);
      }
      if (bounds.top + bounds.height > canvas.height) {
        newTop -= (bounds.top + bounds.height - canvas.height);
      }

      if (newLeft !== obj.left || newTop !== obj.top) {
        obj.set({ left: newLeft, top: newTop });
        obj.setCoords(); 
      }
    };

    canvas.on('object:moving', enforceBoundaries);
    return () => canvas.off('object:moving', enforceBoundaries);
  }, [canvas]);

  // 3. ИСПРАВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ ПРОЕКТА
  const handleSave = async () => {
    if (!canvas || !presetId) return;
    
    setIsSaving(true);
    try {
      const designSettings = canvas.toJSON(); 
      // Отправляем в формате { designSettings: ... }, как требует схема бэкенда
      await projectsAPI.save(presetId, { designSettings });
      alert('✓ Проект сохранен успешно');
    } catch (err) {
      console.error('Ошибка сохранения проекта:', err);
      // Проверьте Network в консоли F12: если ошибка 401, не проходит токен
      alert('✗ Ошибка сохранения: ' + (err.response?.data?.message || 'Сервер недоступен'));
    } finally {
      setIsSaving(false);
    }
  };

  // 4. СОХРАНЕНИЕ ПРЕСЕТА (Шаблона)
  const handleSaveAsPreset = async (e) => {
    e.preventDefault();
    if (!canvas || !presetName.trim()) {
      alert('Введите название пресета');
      return;
    }

    setSavingPreset(true);
    try {
      const designSettings = canvas.toJSON();
      await designPresetsAPI.create({
        name: presetName,
        description: presetDescription,
        designSettings,
      });
      alert('✓ Пресет сохранен успешно!');
      setShowSavePresetModal(false);
      setPresetName('');
      setPresetDescription('');
    } catch (err) {
      alert('✗ Ошибка сохранения пресета');
      console.error(err);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleExport = () => {
    navigate(`/export/${presetId}`);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a] text-slate-300 font-sans overflow-hidden select-none">
      
      {/* ВЕРХНЯЯ ПАНЕЛЬ (HEADER) */}
      <header className="h-14 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-6 z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="h-6 w-[1px] bg-slate-800 mx-2"></div>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-[200px]">{projectTitle}</h1>
            <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase">ID: {presetId?.slice(-6)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isSaving 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20'
            }`}
          >
            {isSaving ? <span className="animate-spin text-[14px]">↻</span> : '💾'} 
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
          
          <button
            onClick={() => setShowSavePresetModal(true)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors border border-slate-700"
          >
            🎨 В пресет
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors border border-slate-700"
          >
            📄 Экспорт PDF
          </button>
        </div>
      </header>

      {/* МОДАЛЬНОЕ ОКНО: Сохранение пресета */}
      {showSavePresetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Сохранить как пресет</h3>
              <p className="text-xs text-slate-500 mt-1">Создайте шаблон на основе текущего дизайна</p>
            </div>
            <form onSubmit={handleSaveAsPreset} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Название пресета</label>
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all"
                  placeholder="Напр: Шаблон новости"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Описание</label>
                <textarea
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 outline-none transition-all resize-none"
                  rows="3"
                  placeholder="Опишите стиль шаблона..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-700 transition-all"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingPreset}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-indigo-900/20"
                >
                  {savingPreset ? 'Сохранение...' : '🎨 Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* РАБОЧАЯ ОБЛАСТЬ */}
      <div className="flex-1 flex overflow-hidden">
        <aside className="w-16 bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-4 z-10 shadow-xl">
          <Toolbar />
        </aside>

        <main className="flex-1 relative bg-[#0b0f1a] overflow-hidden flex flex-col">
          <CanvasView />
        </main>

        <aside className="w-72 bg-[#0f172a] border-l border-slate-800 flex flex-col z-10 shadow-2xl">
          <div className="flex p-1 bg-slate-900/50 m-3 rounded-xl border border-slate-800">
            <button
              onClick={() => setShowRightPanel('properties')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                showRightPanel === 'properties'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Свойства
            </button>
            <button
              onClick={() => setShowRightPanel('layers')}
              className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                showRightPanel === 'layers'
                  ? 'bg-slate-800 text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Слои
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
            {showRightPanel === 'properties' ? <PropertyPanel /> : <LayersPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
};

const WorkspaceLayout = () => (
  <WorkspaceProvider>
    <WorkspaceInner />
  </WorkspaceProvider>
);

export default WorkspaceLayout;