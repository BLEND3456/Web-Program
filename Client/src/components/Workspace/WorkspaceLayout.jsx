import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceProvider, useWorkspace } from '../../context/WorkspaceContext';
import Toolbar from './Toolbar';
import CanvasView from './CanvasView';
import PropertyPanel from './PropertyPanel';
import LayersPanel from './LayersPanel';
import { projectsAPI, designPresetsAPI } from '../../services/api';
import {
  captureCanvasPreview,
  cacheProjectPreview,
  canvasToDesignSettings,
  loadDesignOntoCanvas,
} from '../../utils/projectPreview';
import { Pencil, Minus, Plus } from 'lucide-react';
import ThemeToggle from '../UI/ThemeToggle';
import ImagePlaceholderHandler from './ImagePlaceholderHandler';
import { useAppSettings } from '../../context/AppSettingsContext';

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
    <div className="h-12 border border-app-border bg-app-bg flex items-center px-4 gap-6 text-xs text-app-muted select-none z-10 rounded-xl mt-2 mx-2 shadow-lg">
      {!isText ? (
        <p className="ml-2 text-app-muted font-medium">
          Выделите текстовый элемент для настройки параметров типографики
        </p>
      ) : (
        <div className="flex items-center gap-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pr-4 border-r border-app-border-strong text-app-text font-bold tracking-wider uppercase text-[10px]">
            <span className="text-indigo-400 text-sm font-serif">T</span> Инструмент Текст
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-app-muted">Шрифт</span>
            <select 
              value={fontFamily} 
              onChange={(e) => { setFamily(e.target.value); updateProp('fontFamily', e.target.value); }}
              className="bg-app-input border border-app-border-strong rounded-lg px-2 py-1.5 text-app-text outline-none focus:border-indigo-500 text-xs font-medium cursor-pointer"
            >
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-app-muted">Размер</span>
            <input 
              type="number" 
              value={fontSize} 
              onChange={(e) => { setFontSize(parseInt(e.target.value) || 12); updateProp('fontSize', parseInt(e.target.value) || 12); }}
              className="bg-app-input border border-app-border-strong rounded-lg px-2 py-1.5 text-app-text outline-none focus:border-indigo-500 text-xs font-bold w-16 text-center"
            />
            <span className="text-app-muted font-mono">pt</span>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-app-border-strong">
            {['left', 'center', 'right', 'justify'].map((mode) => (
              <button
                key={mode}
                onClick={() => { setAlign(mode); updateProp('textAlign', mode); }}
                title={`Выровнять: ${mode}`}
                className={`p-2 rounded-lg transition-all ${
                  textAlign === mode 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'hover:bg-app-hover-strong text-app-muted hover:text-app-text'
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
  const { id } = useParams();
  const navigate = useNavigate();
  const { canvas, pageSize, setPageSize } = useWorkspace();
  const { settings } = useAppSettings();
  
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presetForm, setPresetForm] = useState({ name: '', description: '' });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);
  
  const [projectTitle, setProjectTitle] = useState('Загрузка...');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState('');
  
  // УБРАЛИ ДУБЛИКАТЫ:
  const [toast, setToast] = useState(null);
  const canvasContainerRef = useRef(null);
  const leaveSaveRef = useRef({ id, projectTitle, canvas, pageSize: pageSize });
  const [zoomDisplay, setZoomDisplay] = useState(1);
  const sidebarRef = useRef(null);
  const isResizingSidebarRef = useRef(false);
  const [colorPanelRatio, setColorPanelRatio] = useState(() => {
    const saved = localStorage.getItem('workspace_layers_split');
    const parsed = saved ? parseFloat(saved) : 0.6;
    return Number.isFinite(parsed) ? Math.min(0.85, Math.max(0.15, parsed)) : 0.6;
  });

  useEffect(() => {
    const onMove = (e) => {
      if (!isResizingSidebarRef.current || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const ratio = (e.clientY - rect.top) / rect.height;
      setColorPanelRatio(Math.min(0.85, Math.max(0.15, ratio)));
    };
    const onUp = () => {
      if (!isResizingSidebarRef.current) return;
      isResizingSidebarRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setColorPanelRatio((current) => {
        localStorage.setItem('workspace_layers_split', String(current));
        return current;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startSidebarResize = (e) => {
    e.preventDefault();
    isResizingSidebarRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    leaveSaveRef.current = { id, projectTitle, canvas, pageSize: pageSize };
  }, [id, projectTitle, canvas, pageSize]);

  useEffect(() => {
    if (!settings.autosave || !canvas || !id || id === 'undefined') return;
    const timer = setInterval(async () => {
      const { id: pid, projectTitle: title, canvas: c, pageSize: ps } = leaveSaveRef.current;
      if (!c || !pid || pid === 'undefined') return;
      try {
        await projectsAPI.save(pid, {
          name: title,
          designSettings: canvasToDesignSettings(c, ps.width, ps.height),
        });
      } catch (err) {
        console.warn('autosave:', err);
      }
    }, settings.autosaveInterval * 1000);
    return () => clearInterval(timer);
  }, [settings.autosave, settings.autosaveInterval, canvas, id]);

  useEffect(() => {
    if (!canvas) return;
    const grid = 20;
    const onMoving = (e) => {
      if (!settings.snapToGrid) return;
      const t = e.target;
      t.set({
        left: Math.round(t.left / grid) * grid,
        top: Math.round(t.top / grid) * grid,
      });
    };
    canvas.on('object:moving', onMoving);
    return () => canvas.off('object:moving', onMoving);
  }, [canvas, settings.snapToGrid]);

  const persistProject = async ({ withPreview = true, name = projectTitle } = {}) => {
    if (!canvas || !id || id === 'undefined') return { previewUrl: null };

    const designSettings = canvasToDesignSettings(canvas, pageSize.width, pageSize.height);
    let previewUrl = null;

    if (withPreview) {
      previewUrl = captureCanvasPreview(canvas, pageSize.width, pageSize.height);
      if (previewUrl) {
        cacheProjectPreview(id, previewUrl);
      }
    }

    await projectsAPI.save(id, {
      name,
      designSettings,
      ...(previewUrl && { previewUrl })
    });

    return { previewUrl };
  };

  const goToDashboard = async () => {
    try {
      await persistProject({ withPreview: true });
    } catch (err) {
      console.error(err);
      showNotification(err.message || 'Не удалось сохранить перед выходом', 'error');
    }
    navigate('/dashboard');
  };

  useEffect(() => {
    if (!canvas) return;
    const syncZoom = () => setZoomDisplay(canvas.getZoom());
    syncZoom();
    const container = canvasContainerRef.current;
    container?.addEventListener('canvas-zoom', syncZoom);
    window.addEventListener('resize', syncZoom);
    return () => {
      container?.removeEventListener('canvas-zoom', syncZoom);
      window.removeEventListener('resize', syncZoom);
    };
  }, [canvas]);

  const handleZoom = (action) => {
    if (!canvas) return;
    let newZoom = canvas.getZoom();

    if (action === 'in') newZoom += 0.1;
    if (action === 'out') newZoom -= 0.1;
    if (action === 'reset' && canvasContainerRef.current) {
      const container = canvasContainerRef.current;
      const availableWidth = container.clientWidth - 80;
      const availableHeight = container.clientHeight - 80;
      newZoom = Math.min(availableWidth / pageSize.width, availableHeight / pageSize.height);
    }
    if (newZoom < 0.1) newZoom = 0.1;
    if (newZoom > 5) newZoom = 5;

    canvas.setZoom(newZoom);
    canvas.setWidth(pageSize.width * newZoom);
    canvas.setHeight(pageSize.height * newZoom);
    canvas.renderAll();
    setZoomDisplay(newZoom);
    canvasContainerRef.current?.dispatchEvent(new CustomEvent('canvas-layout'));
    canvasContainerRef.current?.dispatchEvent(new CustomEvent('canvas-zoom'));
  };

  useEffect(() => {
    if (!canvas || !id || id === 'undefined') {
      if (!id || id === 'undefined') setProjectTitle('Ошибка ID');
      return;
    }

    let cancelled = false;

    const loadProjectData = async () => {
      setProjectTitle('Загрузка...');
      try {
        const data = await projectsAPI.getById(id);
        if (cancelled) return;

        setProjectTitle(data.name || 'Без названия');
        const pageW = data.width || pageSize.width;
        const pageH = data.height || pageSize.height;
        if (data.width && data.height) {
          setPageSize({ width: data.width, height: data.height });
        }

        if (data.designSettings) {
          await loadDesignOntoCanvas(canvas, data.designSettings, pageW, pageH);
          if (cancelled) return;
          canvas.fire('project:loaded');
        } else {
          canvas.fire('project:loaded');
        }
      } catch (err) {
        if (!cancelled) setProjectTitle('Проект не найден');
      }
    };

    loadProjectData();
    return () => { cancelled = true; };
  }, [id, canvas]);

  const handleTitleDoubleClick = () => { setEditTitleValue(projectTitle); setIsEditingTitle(true); };


  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    const newTitle = editTitleValue.trim() || 'Без названия';
    if (newTitle !== projectTitle) {
      try {
        await persistProject({ withPreview: true, name: newTitle });
        setProjectTitle(newTitle);
        showNotification('Название обновлено', 'success');
      } catch (err) { showNotification('Ошибка сохранения названия', 'error'); }
    }
  };

  const onSaveProject = async () => {
    if (!canvas || !id || id === 'undefined') return showNotification('Ошибка ID', 'error');
    setIsSaving(true);
    try {
      const { previewUrl } = await persistProject({ withPreview: true });
      showNotification(
        previewUrl ? 'Проект успешно сохранен' : 'Сохранено (добавьте элементы на холст для превью)',
        'success'
      );
    } catch (err) { showNotification('Ошибка сохранения', 'error'); } 
    finally { setIsSaving(false); }
  };

  const onCreatePreset = async (e) => {
    e.preventDefault();
    if (!canvas || !presetForm.name.trim()) return;
    setIsCreatingPreset(true);
    try {
      const thumbnail = captureCanvasPreview(canvas, pageSize.width, pageSize.height);
      await designPresetsAPI.create({
        ...presetForm,
        designSettings: canvasToDesignSettings(canvas, pageSize.width, pageSize.height),
        ...(thumbnail && { thumbnail })
      });
      showNotification('Пресет успешно создан', 'success');
      setShowPresetModal(false);
      setPresetForm({ name: '', description: '' });
    } catch (err) { showNotification('Ошибка создания пресета', 'error'); } 
    finally { setIsCreatingPreset(false); }
  };

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const goToExport = async () => {
    if (!id || id === 'undefined') return;
    try {
      await persistProject({ withPreview: true });
      navigate(`/export/${id}`, { state: { from: 'editor' } });
    } catch (err) {
      showNotification(err.message || 'Не удалось сохранить перед экспортом', 'error');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-app-bg text-app-text-secondary overflow-hidden font-sans selection:bg-indigo-500/30 transition-colors duration-200">
      <header className="h-16 border-b border-app-border bg-app-bg/80 backdrop-blur-xl flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-5">
          <button onClick={goToDashboard} className="p-2.5 bg-app-hover hover:bg-app-hover-strong rounded-xl transition-all text-app-muted hover:text-app-text">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="h-6 w-[1px] bg-app-border-strong"></div>
          <div className="flex flex-col">
            {isEditingTitle ? (
              <input autoFocus value={editTitleValue} onChange={(e) => setEditTitleValue(e.target.value)} onBlur={handleTitleSave} onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()} className="bg-app-bg text-[13px] font-semibold text-app-text border border-indigo-500/50 rounded px-1.5 py-0.5 outline-none w-48" />
            ) : (
              <div onClick={handleTitleDoubleClick} className="flex items-center gap-2 group cursor-pointer" title="Нажмите, чтобы изменить название">
                <h1 className="text-[13px] font-semibold text-app-text tracking-wide group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">{projectTitle}</h1>
                <Pencil className="w-3 h-3 text-app-muted group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
            )}
            <p className="text-[10px] text-indigo-400/80 font-mono tracking-widest mt-0.5">ID: {(!id || id === 'undefined') ? 'ERR' : String(id).slice(-8)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={goToExport} className="px-5 py-2 hover:bg-app-hover rounded-xl text-xs font-semibold text-app-text-secondary border border-transparent hover:border-app-border">Экспорт PDF</button>
          <button onClick={() => setShowPresetModal(true)} className="px-5 py-2 hover:bg-app-hover rounded-xl text-xs font-semibold text-app-text-secondary border border-transparent hover:border-app-border">Создать пресет</button>
          <button onClick={onSaveProject} disabled={isSaving} className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-6 py-2 rounded-xl text-xs font-semibold transition-all">
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-visible relative">
        <aside className="relative w-[72px] shrink-0 overflow-visible bg-app-bg border-r border-app-border py-6 flex flex-col items-center z-30">
          <Toolbar />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <ContextBar />
          <main className="flex-1 relative min-h-0 bg-app-canvas overflow-hidden">
            <div className="absolute inset-0 opacity-40 canvas-grid-pattern pointer-events-none" />
            {settings.showRulers && (
              <>
                <div className="absolute top-0 left-0 right-0 h-7 bg-app-bg/90 border-b border-app-border z-20 pointer-events-none flex items-end px-2 gap-8">
                  {[0, 25, 50, 75, 100].map((p) => (
                    <span key={p} className="text-[9px] text-app-muted font-mono">{p}%</span>
                  ))}
                </div>
                <div className="absolute top-7 left-0 bottom-0 w-7 bg-app-bg/90 border-r border-app-border z-20 pointer-events-none" />
              </>
            )}
            {settings.showGuides && (
              <>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-sky-500/50 z-10 pointer-events-none" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-sky-500/50 z-10 pointer-events-none" />
              </>
            )}
            <CanvasView width={pageSize.width} height={pageSize.height} containerRef={canvasContainerRef} />
          </main>
        </div>

        <aside ref={sidebarRef} className="w-[320px] bg-app-bg border-l border-app-border flex flex-col min-h-0 z-10">
          <div
            className="flex flex-col min-h-0 overflow-hidden"
            style={{ height: `${colorPanelRatio * 100}%`, flexShrink: 0 }}
          >
            <div className="px-5 py-3 border-b border-app-border bg-app-bg sticky top-0 z-10 shrink-0">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-app-muted flex items-center gap-2">
                <span className="text-xs">🎨</span> ЦВЕТ И ОФОРМЛЕНИЕ
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-h-0"><PropertyPanel /></div>
          </div>

          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Изменить размер панели слоёв"
            onMouseDown={startSidebarResize}
            className="shrink-0 h-2 flex items-center justify-center cursor-row-resize group z-20 border-y border-app-border hover:border-indigo-500/40 hover:bg-indigo-500/10 active:bg-indigo-500/20 transition-colors"
            title="Потяните, чтобы изменить высоту панели «Слои»"
          >
            <div className="w-10 h-1 rounded-full bg-app-border-strong group-hover:bg-indigo-500/60 transition-colors" />
          </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-app-bg">
            <div className="px-5 py-3 border-b border-app-border bg-app-bg sticky top-0 z-10 shrink-0">
              <h2 className="text-[10px] font-bold tracking-widest uppercase text-app-muted flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                Слои
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 min-h-0"><LayersPanel /></div>
          </div>
        </aside>

        {toast && (
          <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl border shadow-2xl font-medium text-[13px] flex items-center gap-3 z-[100] ${toast.type === 'success' ? 'bg-app-surface text-app-text border-indigo-500/40' : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-500/30'}`}>
            {toast.message}
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(
        <div
          className="fixed bottom-8 flex items-center gap-1 bg-app-bg/95 backdrop-blur-xl border border-app-border-strong rounded-2xl shadow-2xl p-1.5 z-[9999] text-app-text-secondary select-none pointer-events-auto"
          style={{ right: 'calc(320px + 2rem)' }}
        >
          <button onClick={() => handleZoom('out')} className="p-2.5 hover:bg-app-hover-strong rounded-xl transition-all text-app-muted hover:text-app-text group" title="Отдалить">
            <Minus className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
          <div
            className="w-16 text-center text-[11px] font-black uppercase tracking-wider cursor-pointer hover:bg-app-hover py-2.5 rounded-xl hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
            onClick={() => handleZoom('reset')}
            title="По размеру экрана"
          >
            {Math.round(zoomDisplay * 100)}%
          </div>
          <button onClick={() => handleZoom('in')} className="p-2.5 hover:bg-app-hover-strong rounded-xl transition-all text-app-muted hover:text-app-text group" title="Приблизить">
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
        </div>,
        document.body
      )}

      <ImagePlaceholderHandler />

      {showPresetModal && (
        <div className="fixed inset-0 bg-app-overlay backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-app-surface border border-app-border-strong p-8 rounded-3xl w-[400px]">
            <h2 className="text-xl font-semibold text-app-text mb-6">Новый пресет</h2>
            <form onSubmit={onCreatePreset} className="space-y-5">
              <input required type="text" value={presetForm.name} onChange={e => setPresetForm({...presetForm, name: e.target.value})} className="w-full bg-app-hover border border-app-border-strong rounded-xl px-4 py-3.5 text-sm text-app-text focus:outline-none focus:border-indigo-500" placeholder="Название пресета" />
              <input type="text" value={presetForm.description} onChange={e => setPresetForm({...presetForm, description: e.target.value})} className="w-full bg-app-hover border border-app-border-strong rounded-xl px-4 py-3.5 text-sm text-app-text focus:outline-none focus:border-indigo-500" placeholder="Краткое описание (необязательно)" />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowPresetModal(false)} className="flex-1 px-4 py-3.5 bg-app-hover rounded-xl font-semibold text-sm text-app-text-secondary">Отмена</button>
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