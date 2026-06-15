import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FileText, Star, RotateCcw } from 'lucide-react';
import { projectsAPI } from '../../services/api';
import { getCachedProjectPreview } from '../../utils/projectPreview';
import {
  getFavoriteIds,
  getTrashIds,
  toggleFavorite,
  moveToTrash,
  restoreFromTrash,
  removeFromTrash,
  clearAllTrashIds,
  isFavorite,
} from '../../utils/dashboardStorage';

const DeleteModal = ({ isOpen, onClose, onConfirm, mode = 'trash', count = 1, loading = false }) => {
  if (!isOpen) return null;
  const isPermanent = mode === 'permanent';
  const isDeleteAll = mode === 'deleteAll';
  return (
    <div className="fixed inset-0 bg-app-overlay backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-app-surface border border-app-border p-8 rounded-[3rem] w-[400px] shadow-2xl transform animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto text-rose-500">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </div>
        <h2 className="text-xl font-bold text-app-text mb-2 text-center">
          {isDeleteAll ? 'Удалить все проекты?' : isPermanent ? 'Удалить навсегда?' : 'Переместить в корзину?'}
        </h2>
        <p className="text-sm text-app-muted text-center mb-8 px-4 font-medium">
          {isDeleteAll
            ? `Будет удалено без возможности восстановления: ${count} ${count === 1 ? 'проект' : count < 5 ? 'проекта' : 'проектов'}.`
            : isPermanent
              ? 'Проект будет удалён без возможности восстановления.'
              : 'Проект можно будет восстановить из раздела «Корзина».'}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 px-4 py-4 rounded-2xl font-bold text-[10px] bg-app-hover hover:bg-app-hover-strong text-app-text-secondary transition-all uppercase tracking-[0.2em] disabled:opacity-50">Отмена</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-4 rounded-2xl font-bold text-[10px] bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)] uppercase tracking-[0.2em] disabled:opacity-50">
            {loading ? 'Удаление...' : isDeleteAll ? 'Удалить все' : isPermanent ? 'Удалить' : 'В корзину'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectCardPreview = ({ project }) => {
  const src = project.previewUrl || getCachedProjectPreview(project.id);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src, project.id]);

  if (!src || failed) {
    return (
      <FileText
        className="w-12 h-12 text-slate-500 opacity-40"
        strokeWidth={1.5}
      />
    );
  }

  return (
    <img
      src={src}
      alt={project.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-full h-full object-contain rounded-xl bg-white opacity-95 group-hover:opacity-100 group-hover:scale-[1.02] transition-all duration-500"
    />
  );
};

const EMPTY_MESSAGES = {
  library: { title: 'Нет проектов', desc: 'Создайте первый газетный макет кнопкой «Создать файл» или перетащите проект в избранное.' },
  favorites: { title: 'Избранное пусто', desc: 'Отмечайте проекты звёздочкой или перетащите карточку в раздел «Избранное».' },
  trash: { title: 'Корзина пуста', desc: 'Перетащите проект в раздел «Корзина» или удалите через меню на карточке.' },
};

const DRAG_MIME = 'application/x-project-id';

export const TrashDeleteAllButton = ({ onStorageChange, onError }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const trashCount = getTrashIds().size;

  if (trashCount === 0) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const ids = clearAllTrashIds();
      await Promise.all(ids.map((id) => projectsAPI.delete(id).catch(() => null)));
      onStorageChange?.();
      setIsOpen(false);
    } catch (err) {
      onError?.(err.message || 'Не удалось удалить проекты');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="shrink-0 px-6 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/25 hover:border-rose-500/40 transition-all"
      >
        Удалить все
      </button>
      <DeleteModal
        isOpen={isOpen}
        onClose={() => !loading && setIsOpen(false)}
        onConfirm={handleConfirm}
        mode="deleteAll"
        count={trashCount}
        loading={loading}
      />
    </>
  );
};

const buildDragGhost = (sourceEl) => {
  const ghost = sourceEl.cloneNode(true);
  ghost.querySelectorAll('.project-card-overlay').forEach((el) => el.remove());
  ghost.querySelectorAll('button').forEach((el) => el.remove());
  ghost.setAttribute('aria-hidden', 'true');

  ghost.querySelectorAll('*').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
    el.style.boxShadow = 'none';
    el.style.filter = 'none';
    el.style.backdropFilter = 'none';
  });

  const bg = window.getComputedStyle(sourceEl).backgroundColor;

  Object.assign(ghost.style, {
    position: 'fixed',
    top: '-10000px',
    left: '0',
    width: `${sourceEl.offsetWidth}px`,
    opacity: '0.58',
    pointerEvents: 'none',
    zIndex: '9999',
    margin: '0',
    transform: 'none',
    transition: 'none',
    boxShadow: '0 20px 40px rgba(0,0,0,0.28)',
    border: '1px solid rgba(99, 102, 241, 0.35)',
    background: bg,
    borderRadius: window.getComputedStyle(sourceEl).borderRadius,
  });
  document.body.appendChild(ghost);
  return ghost;
};

const ProjectList = ({ mode = 'library', onStorageChange, onProjectDragStart, onProjectDragEnd }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [storageVersion, setStorageVersion] = useState(0);
  const [draggingId, setDraggingId] = useState(null);
  const suppressClickRef = useRef(false);
  const dragGhostRef = useRef(null);

  const cleanupDragGhost = () => {
    if (dragGhostRef.current) {
      dragGhostRef.current.remove();
      dragGhostRef.current = null;
    }
  };

  const canDrag = mode === 'library' || mode === 'favorites';

  const bumpStorage = () => {
    setStorageVersion((v) => v + 1);
    onStorageChange?.();
  };

  useEffect(() => {
    let cancelled = false;
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const data = await projectsAPI.getAll();
        if (!cancelled) setProjects(data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProjects();
    return () => { cancelled = true; };
  }, [location.pathname, location.key, storageVersion]);

  const trashIds = getTrashIds();
  const favoriteIds = getFavoriteIds();

  const filteredProjects = projects.filter((project) => {
    const id = String(project.id);
    const trashed = trashIds.has(id);
    if (mode === 'trash') return trashed;
    if (trashed) return false;
    if (mode === 'favorites') return favoriteIds.has(id);
    return true;
  });

  const openDelete = (e, id) => {
    e.stopPropagation();
    setProjectIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    setDeleteError(null);
    try {
      if (mode === 'trash') {
        await projectsAPI.delete(projectIdToDelete);
        removeFromTrash(projectIdToDelete);
        setProjects(projects.filter((p) => p.id !== projectIdToDelete));
      } else {
        moveToTrash(projectIdToDelete);
      }
      bumpStorage();
      setIsDeleteModalOpen(false);
    } catch (err) {
      setDeleteError(err.message || 'Не удалось удалить проект');
      setIsDeleteModalOpen(false);
    }
  };

  const handleToggleFavorite = (e, id) => {
    e.stopPropagation();
    toggleFavorite(id);
    bumpStorage();
  };

  const handleRestore = async (e, id) => {
    e.stopPropagation();
    restoreFromTrash(id);
    bumpStorage();
  };

  const handleDragStart = (e, project) => {
    if (!canDrag) return;
    suppressClickRef.current = false;
    e.dataTransfer.setData(DRAG_MIME, String(project.id));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(project.id);
    onProjectDragStart?.(project.id);

    const card = e.currentTarget;
    if (card) {
      cleanupDragGhost();
      const ghost = buildDragGhost(card);
      dragGhostRef.current = ghost;
      e.dataTransfer.setDragImage(ghost, card.offsetWidth / 2, 48);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    cleanupDragGhost();
    suppressClickRef.current = true;
    onProjectDragEnd?.();
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const handleCardClick = (projectId) => {
    if (suppressClickRef.current) return;
    navigate(`/editor/${projectId}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {[1, 2, 3].map((i) => <div key={i} className="aspect-[1.1] bg-app-hover rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!filteredProjects.length) {
    const empty = EMPTY_MESSAGES[mode] || EMPTY_MESSAGES.library;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-app-hover flex items-center justify-center mb-6 text-app-muted">
          <FileText className="w-9 h-9 opacity-50" strokeWidth={1.25} />
        </div>
        <h3 className="text-xl font-bold text-app-text mb-2">{empty.title}</h3>
        <p className="text-sm text-app-muted max-w-md">{empty.desc}</p>
      </div>
    );
  }

  return (
    <>
      {deleteError && (
        <div className="mb-6 px-5 py-3 rounded-2xl bg-rose-950/90 text-rose-200 border border-rose-500/30 text-sm font-medium">
          {deleteError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProjects.map((project) => {
          const favorited = isFavorite(project.id);
          const isDragging = draggingId === project.id;
          return (
            <div
              key={project.id}
              draggable={canDrag}
              onDragStart={(e) => handleDragStart(e, project)}
              onDragEnd={handleDragEnd}
              onClick={() => handleCardClick(project.id)}
              className={`group relative bg-app-surface border border-app-border rounded-2xl p-6 hover:bg-app-elevated hover:border-app-border-strong transition-all duration-500 shadow-xl dark:shadow-black/50 ${
                canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
              } ${isDragging ? 'opacity-50 scale-[0.98] border-indigo-500/35 shadow-md' : ''}`}
            >
              {mode !== 'trash' && (
                <button
                  type="button"
                  draggable={false}
                  onDragStart={(e) => e.stopPropagation()}
                  onClick={(e) => handleToggleFavorite(e, project.id)}
                  className={`absolute top-5 right-5 z-10 w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    favorited
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-app-hover/80 text-app-muted opacity-0 group-hover:opacity-100 hover:text-amber-500'
                  }`}
                  title={favorited ? 'Убрать из избранного' : 'В избранное'}
                >
                  <Star className="w-4 h-4" fill={favorited ? 'currentColor' : 'none'} strokeWidth={2} />
                </button>
              )}

              <div className="aspect-[1.1] bg-slate-100 dark:bg-[#1a1a1e] rounded-xl mb-6 overflow-hidden relative flex items-center justify-center ring-1 ring-app-border-strong shadow-inner">
                <ProjectCardPreview project={project} />

                <div className="project-card-overlay absolute inset-0 bg-indigo-950/40 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 pointer-events-none group-hover:pointer-events-auto">
                  {mode === 'trash' ? (
                    <>
                      <button
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={(e) => handleRestore(e, project.id)}
                        className="pointer-events-auto bg-white text-indigo-950 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Восстановить
                      </button>
                      <button
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={(e) => openDelete(e, project.id)}
                        className="pointer-events-auto text-rose-400/60 hover:text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-2"
                      >
                        Удалить навсегда
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); navigate(`/export/${project.id}`, { state: { from: 'dashboard' } }); }}
                        className="pointer-events-auto bg-white text-indigo-950 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                      >
                        Экспорт PDF
                      </button>
                      <button
                        draggable={false}
                        onDragStart={(e) => e.stopPropagation()}
                        onClick={(e) => openDelete(e, project.id)}
                        className="pointer-events-auto text-rose-400/60 hover:text-rose-400 text-[10px] font-bold uppercase tracking-widest mt-2"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="px-1">
                <h3 className="text-xl font-bold text-app-text mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors truncate">
                  Проект &quot;{project.name || 'Без названия'}&quot;
                </h3>
                <p className="text-[10px] font-black text-app-muted uppercase tracking-[0.2em]">Газетный макет</p>
                <p className="text-[10px] font-mono text-app-muted font-bold tracking-tighter italic mt-1">
                  {project.width} x {project.height} PX
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        mode={mode === 'trash' ? 'permanent' : 'trash'}
      />
    </>
  );
};

export default ProjectList;
