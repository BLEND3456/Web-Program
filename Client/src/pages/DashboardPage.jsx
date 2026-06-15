import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ProjectList, { TrashDeleteAllButton } from '../components/Dashboard/ProjectList';
import TemplatesSection from '../components/Dashboard/TemplatesSection';
import SettingsSection from '../components/Dashboard/SettingsSection';
import ThemeToggle from '../components/UI/ThemeToggle';
import { projectsAPI, designPresetsAPI } from '../services/api';
import { buildNewspaperTemplateJSON, NEWSPAPER_TEMPLATES } from '../utils/newspaperTemplates';
import { addToFavorites, moveToTrash } from '../utils/dashboardStorage';
import { Plus, FolderArchive, LogOut, Newspaper, FileText, Briefcase, LayoutTemplate, Bookmark, Trash2, Star, Settings } from 'lucide-react';

const DRAG_MIME = 'application/x-project-id';
const DROP_TARGETS = new Set(['favorites', 'trash']);

const NAV_SECTIONS = [
  { id: 'library', label: 'Библиотека', icon: FolderArchive },
  { id: 'templates', label: 'Шаблоны', icon: LayoutTemplate },
  { id: 'favorites', label: 'Избранное', icon: Star },
  { id: 'trash', label: 'Корзина', icon: Trash2 },
];

const SECTION_HEADERS = {
  library: {
    title: 'Ваши проекты',
    subtitle: 'Управляйте своими газетными макетами и публикациями',
  },
  templates: {
    title: 'Шаблоны',
    subtitle: 'Готовые макеты и сохранённые пресеты для быстрого старта',
  },
  favorites: {
    title: 'Избранное',
    subtitle: 'Проекты, отмеченные звёздочкой для быстрого доступа',
  },
  trash: {
    title: 'Корзина',
    subtitle: 'Удалённые проекты — восстановите или удалите навсегда',
  },
  settings: {
    title: 'Настройки',
    subtitle: 'Профиль, редактор и параметры экспорта',
  },
};

const NEW_DOCUMENT_PRESETS = [
  { id: 'a3-150', name: 'A3 (Таблоид)', sub: '150 DPI', w: 1754, h: 2480, desc: '29.7 × 42 см' },
  { id: 'a3-200', name: 'A3', sub: '200 DPI', w: 2339, h: 3307, desc: '29.7 × 42 см' },
  { id: 'tabloid-us', name: 'Таблоид (US)', sub: '150 DPI', w: 1650, h: 2550, desc: '11 × 17 дюймов' },
  { id: 'berliner', name: 'Берлинер', sub: '150 DPI', w: 1890, h: 2776, desc: '32 × 47 см' },
  { id: 'a2', name: 'A2 (Большой формат)', sub: '150 DPI', w: 2480, h: 3508, desc: '42 × 59.4 см' },
];

const TEMPLATE_ICONS = {
  blank: LayoutTemplate,
  classic: FileText,
  business: Briefcase,
  minimal: Newspaper,
};

const CreateFileModal = ({ isOpen, onClose, onConfirm, initialTemplateId, initialPresetId }) => {
  const [selected, setSelected] = useState(NEW_DOCUMENT_PRESETS[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [selectedPresetId, setSelectedPresetId] = useState(null);
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [name, setName] = useState('Без названия-1');
  const [isPortrait, setIsPortrait] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    if (initialPresetId) {
      setSelectedPresetId(initialPresetId);
      setSelectedTemplate(null);
    } else if (initialTemplateId) {
      setSelectedTemplate(initialTemplateId);
      setSelectedPresetId(null);
    } else {
      setSelectedTemplate('blank');
      setSelectedPresetId(null);
    }
  }, [isOpen, initialTemplateId, initialPresetId]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const loadPresets = async () => {
      setPresetsLoading(true);
      try {
        const data = await designPresetsAPI.getMine();
        if (!cancelled) setSavedPresets(data);
      } catch {
        if (!cancelled) setSavedPresets([]);
      } finally {
        if (!cancelled) setPresetsLoading(false);
      }
    };
    loadPresets();
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectBuiltin = (id) => {
    setSelectedTemplate(id);
    setSelectedPresetId(null);
  };

  const selectSavedPreset = (id) => {
    setSelectedPresetId(id);
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    const finalW = isPortrait ? selected.w : selected.h;
    const finalH = isPortrait ? selected.h : selected.w;
    onConfirm({
      name,
      width: finalW,
      height: finalH,
      templateId: selectedPresetId ? null : (selectedTemplate || 'blank'),
      presetId: selectedPresetId,
    });
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

        <div className="w-[340px] p-10 flex flex-col min-h-0 bg-app-surface">
          <h2 className="text-[10px] font-black text-app-muted uppercase tracking-[0.3em] mb-6 shrink-0">Детали пресета</h2>

          <div className="flex flex-col flex-1 min-h-0 gap-5">
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-app-border-strong py-2 text-lg font-bold text-app-text outline-none focus:border-indigo-500 transition-all shrink-0" />
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div><label className="text-[9px] font-bold text-app-muted uppercase mb-2 block">Ширина</label><div className="bg-app-hover rounded-xl p-3 text-sm text-app-text-secondary">{isPortrait ? selected.w : selected.h} px</div></div>
              <div><label className="text-[9px] font-bold text-app-muted uppercase mb-2 block">Высота</label><div className="bg-app-hover rounded-xl p-3 text-sm text-app-text-secondary">{isPortrait ? selected.h : selected.w} px</div></div>
            </div>
            <div className="shrink-0">
              <label className="text-[9px] font-bold text-app-muted uppercase mb-3 block text-center">Ориентация</label>
              <div className="flex gap-2">
                <button onClick={() => setIsPortrait(true)} className={`flex-1 p-3 rounded-xl border flex items-center justify-center transition-all ${isPortrait ? 'bg-indigo-600/20 border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'bg-app-hover border-transparent opacity-60'}`}><span className="text-[10px] font-bold uppercase">Книжная</span></button>
                <button onClick={() => setIsPortrait(false)} className={`flex-1 p-3 rounded-xl border flex items-center justify-center transition-all ${!isPortrait ? 'bg-indigo-600/20 border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'bg-app-hover border-transparent opacity-60'}`}><span className="text-[10px] font-bold uppercase">Альбомная</span></button>
              </div>
            </div>

            <div className="flex flex-col flex-1 min-h-0 pt-1">
              <label className="text-[9px] font-bold text-app-muted uppercase mb-2 block tracking-[0.2em] shrink-0">Готовые шаблоны</label>
              <div className="flex-1 min-h-[120px] max-h-[220px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-1 -mr-1">
                <div className="grid grid-cols-2 gap-2 pb-1">
              {NEWSPAPER_TEMPLATES.map((tpl) => {
                const Icon = TEMPLATE_ICONS[tpl.id];
                const isActive = !selectedPresetId && selectedTemplate === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => selectBuiltin(tpl.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-indigo-600/10 border-indigo-500/50'
                        : 'bg-app-hover border-app-border hover:bg-app-hover-strong'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400' : 'bg-app-elevated text-app-muted'
                    }`}>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-app-text truncate">{tpl.name}</span>
                      <span className="block text-[8px] text-app-muted leading-tight mt-0.5">{tpl.desc}</span>
                    </div>
                  </button>
                );
              })}

              {presetsLoading && (
                <div className="col-span-2 text-[9px] text-app-muted text-center py-2">Загрузка ваших шаблонов…</div>
              )}

              {!presetsLoading && savedPresets.map((preset) => {
                const isActive = selectedPresetId === preset.id;
                return (
                  <button
                    key={`preset-${preset.id}`}
                    type="button"
                    onClick={() => selectSavedPreset(preset.id)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-violet-600/10 border-violet-500/50'
                        : 'bg-app-hover border-app-border hover:bg-app-hover-strong'
                    }`}
                  >
                    <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? 'bg-violet-500/20 text-violet-500 dark:text-violet-400' : 'bg-app-elevated text-app-muted'
                    }`}>
                      <Bookmark className="w-4 h-4" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-app-text truncate">{preset.name}</span>
                      <span className="block text-[8px] text-app-muted leading-tight mt-0.5 truncate">
                        {preset.description || 'Мой сохранённый макет'}
                      </span>
                    </div>
                  </button>
                );
              })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-auto shrink-0">
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
  const [activeSection, setActiveSection] = useState('library');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createInitialTemplate, setCreateInitialTemplate] = useState(null);
  const [createInitialPreset, setCreateInitialPreset] = useState(null);
  const [listKey, setListKey] = useState(0);
  const [dropHover, setDropHover] = useState(null);
  const [isDraggingProject, setIsDraggingProject] = useState(false);

  const bumpList = useCallback(() => setListKey((k) => k + 1), []);

  const handleProjectDragStart = useCallback(() => {
    setIsDraggingProject(true);
  }, []);

  const handleProjectDragEnd = useCallback(() => {
    setIsDraggingProject(false);
    setDropHover(null);
  }, []);

  const handleNavDrop = useCallback((e, sectionId) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData(DRAG_MIME);
    if (!projectId || !DROP_TARGETS.has(sectionId)) return;

    if (sectionId === 'favorites') {
      addToFavorites(projectId);
    } else if (sectionId === 'trash') {
      moveToTrash(projectId);
    }

    setDropHover(null);
    setIsDraggingProject(false);
    bumpList();
  }, [bumpList]);

  const openCreateModal = (opts = {}) => {
    setCreateInitialTemplate(opts.templateId ?? null);
    setCreateInitialPreset(opts.presetId ?? null);
    setIsCreateModalOpen(true);
  };

  const header = SECTION_HEADERS[activeSection] || SECTION_HEADERS.library;

  const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
  const handleConfirmCreate = async (data) => {
    setCreateError(null);
    try {
      let designSettings = null;

      if (data.presetId) {
        const preset = await designPresetsAPI.getById(data.presetId);
        const newProject = await projectsAPI.create({
          name: data.name,
          width: data.width,
          height: data.height,
        });
        if (preset?.designSettings) {
          await projectsAPI.save(newProject.id, { designSettings: preset.designSettings });
        }
        navigate(`/editor/${newProject.id}`);
        return;
      }

      if (data.templateId && data.templateId !== 'blank') {
        designSettings = buildNewspaperTemplateJSON(data.templateId, data.width, data.height);
      }

      const newProject = await projectsAPI.create({
        name: data.name,
        width: data.width,
        height: data.height,
      });

      if (designSettings) {
        await projectsAPI.save(newProject.id, { designSettings });
      }

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
            <button
              type="button"
              onClick={() => setActiveSection('library')}
              className="text-2xl font-serif font-bold text-app-text tracking-tighter italic hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors text-left"
              title="На главную"
            >
              NEWS EDIT
            </button>
            <ThemeToggle />
          </div>
        </div>

        <nav
          className="flex-1 space-y-4"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setDropHover(null);
            }
          }}
        >
          <button
            onClick={() => openCreateModal()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-2xl font-bold text-[10px] tracking-[0.1em] flex items-center justify-center gap-2.5 transition-all shadow-[0_10px_30px_rgba(79,70,229,0.25)] uppercase mb-10"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Создать файл
          </button>

          {NAV_SECTIONS.map(({ id, label, icon: Icon }) => {
            const active = activeSection === id;
            const isDropZone = DROP_TARGETS.has(id);
            const isTrashHover = dropHover === 'trash' && id === 'trash';
            const isFavHover = dropHover === 'favorites' && id === 'favorites';

            let dropClasses = '';
            if (isTrashHover) {
              dropClasses = '!bg-rose-600/45 !border-rose-500 !text-rose-300 shadow-[0_0_32px_rgba(244,63,94,0.55)] scale-[1.02]';
            } else if (isFavHover) {
              dropClasses = '!bg-amber-500/25 !border-amber-500 !text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.35)] scale-[1.02]';
            } else if (id === 'trash' && isDraggingProject) {
              dropClasses = 'border-rose-500/30';
            }

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                onDragOver={(e) => {
                  if (!isDropZone) return;
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'move';
                  setDropHover(id);
                }}
                onDragEnter={(e) => {
                  if (!isDropZone) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setDropHover(id);
                }}
                onDragLeave={(e) => {
                  if (!isDropZone) return;
                  e.stopPropagation();
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    setDropHover((prev) => (prev === id ? null : prev));
                  }
                }}
                onDrop={(e) => handleNavDrop(e, id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] border transition-all duration-200 ${
                  dropClasses
                    ? dropClasses
                    : active
                      ? 'bg-app-hover text-app-text border-app-border-strong shadow-inner'
                      : 'text-app-muted border-transparent hover:bg-app-hover hover:text-app-text hover:border-app-border'
                } ${isDropZone && isDraggingProject ? 'ring-1 ring-dashed ring-app-border-strong' : ''}`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isTrashHover
                      ? '!text-rose-300'
                      : isFavHover
                        ? '!text-amber-300'
                        : active
                          ? 'text-indigo-500 dark:text-indigo-400'
                          : 'text-app-muted'
                  }`}
                  strokeWidth={2}
                />
                {label.toUpperCase()}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] border transition-all mt-6 ${
            activeSection === 'settings'
              ? 'bg-app-hover text-app-text border-app-border-strong shadow-inner'
              : 'text-app-muted border-transparent hover:bg-app-hover hover:text-app-text hover:border-app-border'
          }`}
        >
          <Settings className={`w-4 h-4 shrink-0 ${activeSection === 'settings' ? 'text-indigo-500 dark:text-indigo-400' : 'text-app-muted'}`} strokeWidth={2} />
          НАСТРОЙКИ
        </button>

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
          <header className="mb-14 flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-4xl font-bold text-app-text mb-3 tracking-tight">{header.title}</h1>
              <p className="text-app-muted font-medium text-sm">{header.subtitle}</p>
            </div>
            {activeSection === 'trash' && (
              <TrashDeleteAllButton
                key={listKey}
                onStorageChange={bumpList}
                onError={(msg) => setCreateError(msg)}
              />
            )}
          </header>

          {activeSection === 'templates' ? (
            <TemplatesSection onUseTemplate={(opts) => openCreateModal(opts)} />
          ) : activeSection === 'settings' ? (
            <SettingsSection />
          ) : (
            <ProjectList
              key={`${activeSection}-${listKey}`}
              mode={activeSection}
              onStorageChange={bumpList}
              onProjectDragStart={handleProjectDragStart}
              onProjectDragEnd={handleProjectDragEnd}
            />
          )}
        </div>

        {(activeSection === 'library' || activeSection === 'favorites') && (
          <p className="absolute bottom-8 left-12 right-12 max-w-xl text-[11px] text-app-muted leading-relaxed pointer-events-none">
            Карточку проекта можно перетащить в раздел «Избранное» или «Корзина» в меню слева.
          </p>
        )}
      </main>

      {createError && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-500/30 text-sm font-medium">
          {createError}
        </div>
      )}

      <CreateFileModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateError(null);
          setCreateInitialTemplate(null);
          setCreateInitialPreset(null);
        }}
        onConfirm={handleConfirmCreate}
        initialTemplateId={createInitialTemplate}
        initialPresetId={createInitialPreset}
      />
    </div>
  );
};

export default DashboardPage;
