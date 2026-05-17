import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Toolbar from './Toolbar';
import CanvasView from './CanvasView';
import PropertyPanel from './PropertyPanel';
import LayersPanel from './LayersPanel';
import { projectsAPI, designPresetsAPI } from '../../services/api';

// --- ВЕРХНЯЯ СТРОКА НАСТРОЕК (CONTEXT BAR) ---
const ContextBar = () => {
  const { selectedObject, canvas } = useWorkspace();
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFamily] = useState('Arial');
  const [textAlign, setAlign] = useState('left');

  useEffect(() => {
    if (!selectedObject) return;
    const sync = () => {
      setFontSize(selectedObject.fontSize || 32);
      setFamily(selectedObject.fontFamily || 'Arial');
      setAlign(selectedObject.textAlign || 'left');
    };
    sync();
    selectedObject.on('modified', sync);
    return () => selectedObject.off('modified', sync);
  }, [selectedObject]);

  const updateProp = (key, value) => {
    if (!selectedObject || !canvas) return;
    selectedObject.set(key, value);
    canvas.renderAll();
  };

  const isText = selectedObject && (selectedObject.type === 'i-text' || selectedObject.type === 'textbox');

  const alignIcons = {
    left: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="6" x2="3" y2="6"></line><line x1="15" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>
      </svg>
    ),
    center: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="6" x2="3" y2="6"></line><line x1="19" y1="12" x2="5" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>
      </svg>
    ),
    right: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="9" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>
      </svg>
    ),
    justify: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line>
      </svg>
    )
  };

  return (
    <div className="h-12 border-b border-white/5 bg-[#09090b] flex items-center px-6 gap-6 text-xs text-slate-400 select-none z-10">
      {!isText ? (
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-700 animate-pulse"></span>
          Выделите текстовый элемент для настройки параметров типографики
        </div>
      ) : (
        <div className="flex items-center gap-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pr-4 border-r border-white/10 text-white font-bold tracking-wider uppercase text-[10px]">
            <span className="text-indigo-400 text-sm font-serif">T</span> Инструмент Текст
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Шрифт</span>
            <select 
              value={fontFamily} 
              onChange={(e) => { setFamily(e.target.value); updateProp('fontFamily', e.target.value); }}
              className="bg-[#121214] border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Размер</span>
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => { setFontSize(parseInt(e.target.value) || 12); updateProp('fontSize', parseInt(e.target.value) || 12); }}
              className="bg-[#121214] border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 outline-none focus:border-indigo-500 text-xs font-bold w-16 text-center"
            />
            <span className="text-slate-600 font-mono">pt</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            {['left', 'center', 'right', 'justify'].map((mode) => (
              <button
                key={mode}
                onClick={() => { setAlign(mode); updateProp('textAlign', mode); }}
                title={`Выровнять: ${mode}`}
                className={`p-2 rounded-lg transition-all ${
                  textAlign === mode 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                {alignIcons[mode]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ РАБОЧЕЙ ОБЛАСТИ ---
const WorkspaceInner = () => {
  const [projectSize, setProjectSize] = useState({ width: 1200, height: 1700 });
  const { id } = useParams();
  const navigate = useNavigate();
  const { canvas } = useWorkspace();
  
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetForm, setPresetForm] = useState({ name: '', description: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  
  const [projectTitle, setProjectTitle] = useState('Загрузка...');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [toast, setToast] = useState(null);

  const hasLoadedData = useRef(false);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!canvas || hasLoadedData.current) return;
    hasLoadedData.current = true;

    const loadProjectData = async () => {
      if (!id || id === 'undefined') { setProjectTitle('Ошибка ID'); return; }
      try {
        const data = await projectsAPI.getById(id);
        setProjectTitle(data.name || 'Без названия');
        if (data.width && data.height) setProjectSize({ width: data.width, height: data.height });
        
        if (data.designSettings) {
          canvas.clear();
          canvas.loadFromJSON(data.designSettings, () => canvas.renderAll());
        }
      } catch (err) { setProjectTitle('Проект не найден'); }
    };
    loadProjectData();
  }, [id, canvas]);

  const handleTitleDoubleClick = () => { setEditTitleValue(projectTitle); setIsEditingTitle(true); };

  // УМНАЯ ГЕНЕРАЦИЯ ДЛЯ ТУМБНЕЙЛА (ВЫНЕСЕНА В УТИЛИТУ)
  const generatePreviewDataUrl = () => {
    if (!canvas) return null;
    // Находим все служебные элементы сетки и направляющих
    const guides = canvas.getObjects().filter(o => o.isGridLine || o.excludeFromExport);
    // Временно хидим их, чтобы картинка была чистой
    guides.forEach(g => g.set('visible', false));
    canvas.renderAll();

    const dataUrl = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.4,
      multiplier: 0.25 // Сжимаем до 25%, чтобы не забивать базу огромными строками
    });

    // Возвращаем сетку обратно на экран
    guides.forEach(g => g.set('visible', true));
    canvas.renderAll();

    return dataUrl;
  };

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    const newTitle = editTitleValue.trim() || 'Без названия';
    if (newTitle !== projectTitle) {
      setProjectTitle(newTitle);
      try {
        const previewUrl = generatePreviewDataUrl();
        await projectsAPI.save(id, { name: newTitle, designSettings: canvas.toJSON(), previewUrl });
        showNotification('Название обновлено', 'success');
      } catch (err) { showNotification('Ошибка сохранения названия', 'error'); }
    }
  };

  const onSaveProject = async () => {
    if (!canvas || !id || id === 'undefined') return showNotification('Ошибка ID', 'error');
    setIsSaving(true);
    try {
      const previewUrl = generatePreviewDataUrl();
      await projectsAPI.save(id, { name: projectTitle, designSettings: canvas.toJSON(), previewUrl });
      showNotification('Проект успешно сохранен', 'success');
    } catch (err) { showNotification('Ошибка сохранения', 'error'); } 
    finally { setIsSaving(false); }
  };

  const onCreatePreset = async (e) => {
    e.preventDefault();
    if (!canvas || !presetForm.name.trim()) return;
    setIsCreatingPreset(true);
    try {
      await designPresetsAPI.create({ ...presetForm, designSettings: canvas.toJSON() });
      showNotification('Пресет успешно создан', 'success');
      setShowPresetModal(false);
      setPresetForm({ name: '', description: '' });
    } catch (err) { showNotification('Ошибка создания пресета', 'error'); } 
    finally { setIsCreatingPreset(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-slate-300 overflow-hidden font-sans selection:bg-indigo-500/30">
      <header className="h-16 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <div className="flex flex-col">
            {isEditingTitle ? (
              <input autoFocus value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} className="bg-[#09090b] text-[13px] font-semibold text-slate-100 border border-indigo-500/50 rounded px-1.5 py-0.5 outline-none w-48" />
            ) : (
              <h1 onDoubleClick={handleTitleDoubleClick} className="text-[13px] font-semibold text-slate-100 tracking-wide cursor-pointer hover:text-indigo-400 transition-colors">{projectTitle}</h1>
            )}
            <p className="text-[10px] text-indigo-400/80 font-mono tracking-widest mt-0.5">ID: {(!id || id === 'undefined') ? 'ERR' : String(id).slice(-8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => id && id !== 'undefined' && navigate(`/export/${id}`)} className="px-5 py-2 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300 border border-transparent hover:border-white/5">Экспорт PDF</button>
          <button onClick={() => setShowPresetModal(true)} className="px-5 py-2 hover:bg-white/5 rounded-xl text-xs font-semibold text-slate-300 border border-transparent hover:border-white/5">Создать пресет</button>
          <button onClick={onSaveProject} disabled={isSaving} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-6 py-2 rounded-xl text-xs font-semibold transition-all">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-[72px] bg-[#09090b] border-r border-white/5 py-6 flex flex-col items-center z-10"><Toolbar /></aside>

        <div className="flex-1 flex flex-col min-w-0">
          <ContextBar />
          <main className="flex-1 relative bg-[#121214] flex items-center justify-center overflow-hidden z-0">
            <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            <CanvasView width={projectSize.width} height={projectSize.height} />
          </main>
        </div>

        <aside className="w-[320px] bg-[#09090b] border-l border-white/5 flex flex-col z-10">
          <div className="flex flex-col shrink-0 h-[60%] border-b border-white/5">
            <div className="px-5 py-3 border-b border-white/5 bg-[#09090b] sticky top-0 z-10">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <span className="text-xs">🎨</span> ЦВЕТ И ОФОРМЛЕНИЕ
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5"><PropertyPanel /></div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#09090b]">
            <div className="px-5 py-3 border-b border-white/5 bg-[#09090b] sticky top-0 z-10">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                Слои
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5"><LayersPanel /></div>
          </div>
        </aside>

        {toast && (
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl border backdrop-blur-xl font-medium text-[13px] flex items-center gap-3 ${toast.type === 'success' ? 'bg-[#09090b]/90 text-slate-200 border-indigo-500/30' : 'bg-rose-950/90 text-rose-200 border-rose-500/30'}`}>
            {toast.message}
          </div>
        )}
      </div>

      {showPresetModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#09090b] border border-white/10 p-8 rounded-3xl w-[400px]">
            <h2 className="text-xl font-semibold text-white mb-6">Новый пресет</h2>
            <form onSubmit={onCreatePreset} className="space-y-5">
              <input required type="text" value={presetForm.name} onChange={e => setPresetForm({...presetForm, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500" placeholder="Название пресета" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPresetModal(false)} className="flex-1 px-4 py-3.5 bg-white/5 rounded-xl font-semibold text-sm text-slate-300">Отмена</button>
                <button type="submit" className="flex-1 px-4 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const WorkspaceLayout = () => (<WorkspaceProvider><WorkspaceInner /></WorkspaceProvider>);
export default WorkspaceLayout;