import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Toolbar from './Toolbar';
import CanvasView from './CanvasView';
import PropertyPanel from './PropertyPanel';
import LayersPanel from './LayersPanel';
import { projectsAPI, designPresetsAPI } from '../../services/api';

const WorkspaceInner = () => {
  // 1. Извлекаем id из параметров URL
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 2. Безопасно получаем контекст (защита от белого экрана)
  const workspace = useWorkspace();
  const canvas = workspace ? workspace.canvas : null;
  
  const [activePanel, setActivePanel] = useState('properties'); 
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetForm, setPresetForm] = useState({ name: '', description: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Загрузка...');

  // 3. Загрузка данных проекта
  useEffect(() => {
    const loadProjectData = async () => {
      if (!id || id === 'undefined') return;
      try {
        const data = await projectsAPI.getById(id);
        if (data) setProjectTitle(data.name || 'Без названия');
      } catch (err) {
        console.error('Ошибка загрузки проекта:', err);
        setProjectTitle('Проект не найден');
      }
    };
    loadProjectData();
  }, [id]);

  // 4. Безопасное ограничение границ
  useEffect(() => {
    if (!canvas) return;

    const handleObjectMoving = (e) => {
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

    canvas.on('object:moving', handleObjectMoving);
    return () => canvas.off('object:moving', handleObjectMoving);
  }, [canvas]);

  const onSaveProject = async () => {
    if (!canvas || !id) {
      alert('Ошибка: Холст не готов или ID отсутствует');
      return;
    }
    
    setIsSaving(true);
    try {
      const designSettings = canvas.toJSON(); 
      await projectsAPI.save(id, { designSettings });
      alert('✓ Проект успешно сохранен');
    } catch (err) {
      alert('✗ Ошибка сохранения: ' + (err.message || 'Нет связи с сервером'));
    } finally {
      setIsSaving(false);
    }
  };

  const onCreatePreset = async (e) => {
    e.preventDefault();
    if (!canvas || !presetForm.name.trim()) return;

    setIsCreatingPreset(true);
    try {
      const designSettings = canvas.toJSON();
      await designPresetsAPI.create({ ...presetForm, designSettings });
      alert('✓ Пресет создан');
      setShowPresetModal(false);
    } catch (err) {
      alert('✗ Ошибка создания пресета');
    } finally {
      setIsCreatingPreset(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0b0f1a] text-slate-300 overflow-hidden font-sans">
      <header className="h-14 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between px-6 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div className="h-6 w-[1px] bg-slate-800"></div>
          <div>
            <h1 className="text-sm font-bold text-white max-w-[200px] truncate">{projectTitle}</h1>
            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-tighter">
              {/* Защищенный вывод ID */}
              Project ID: {id ? String(id).slice(-8) : '...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSaveProject} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-all">
            {isSaving ? '⏳' : '💾'} {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button onClick={() => setShowPresetModal(true)} className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white">
            🎨 Создать пресет
          </button>
          <button onClick={() => id && navigate(`/export/${id}`)} className="px-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-white">
            📄 Экспорт
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-16 bg-[#0f172a] border-r border-slate-800 flex flex-col items-center py-4"><Toolbar /></aside>
        <main className="flex-1 relative bg-[#0b0f1a] flex items-center justify-center overflow-hidden"><CanvasView /></main>
        <aside className="w-80 bg-[#0f172a] border-l border-slate-800 flex flex-col z-10 shadow-2xl">
          <div className="flex p-1 bg-slate-900/50 m-4 rounded-xl border border-slate-800">
            <button onClick={() => setActivePanel('properties')} className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-lg ${activePanel === 'properties' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}>Свойства</button>
            <button onClick={() => setActivePanel('layers')} className={`flex-1 py-2 text-[11px] font-bold uppercase rounded-lg ${activePanel === 'layers' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500'}`}>Слои</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-10">{activePanel === 'properties' ? <PropertyPanel /> : <LayersPanel />}</div>
        </aside>
      </div>

      {showPresetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-white mb-4">Новый шаблон</h3>
            <input type="text" value={presetForm.name} onChange={(e) => setPresetForm({...presetForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 outline-none" placeholder="Название пресета" required />
            <textarea value={presetForm.description} onChange={(e) => setPresetForm({...presetForm, description: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 h-24 outline-none resize-none" placeholder="Описание..." />
            <div className="flex gap-4">
              <button type="button" onClick={() => setShowPresetModal(false)} className="flex-1 py-3 bg-slate-800 rounded-xl font-bold">Отмена</button>
              <button type="button" onClick={onCreatePreset} disabled={isCreatingPreset} className="flex-1 py-3 bg-indigo-600 rounded-xl font-bold text-white disabled:opacity-50">Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkspaceLayout = () => (
  <WorkspaceProvider>
    <WorkspaceInner />
  </WorkspaceProvider>
);

export default WorkspaceLayout;