const FAVORITES_KEY = 'dashboard_favorites';
const TRASH_KEY = 'dashboard_trash';

const getCurrentUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (stored?.id) return String(stored.id);
    const token = localStorage.getItem('token');
    if (!token) return 'guest';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return String(payload.userId ?? 'guest');
  } catch {
    return 'guest';
  }
};

const readMap = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
};

const writeMap = (key, map) => {
  localStorage.setItem(key, JSON.stringify(map));
};

const userIds = (key) => {
  const uid = getCurrentUserId();
  const map = readMap(key);
  return new Set((map[uid] || []).map(String));
};

const setUserIds = (key, ids) => {
  const uid = getCurrentUserId();
  const map = readMap(key);
  map[uid] = [...ids];
  writeMap(key, map);
};

export const getFavoriteIds = () => userIds(FAVORITES_KEY);

export const getTrashIds = () => userIds(TRASH_KEY);

export const isFavorite = (projectId) => getFavoriteIds().has(String(projectId));

export const isTrashed = (projectId) => getTrashIds().has(String(projectId));

export const toggleFavorite = (projectId) => {
  const ids = getFavoriteIds();
  const id = String(projectId);
  if (ids.has(id)) ids.delete(id);
  else ids.add(id);
  setUserIds(FAVORITES_KEY, ids);
};

export const addToFavorites = (projectId) => {
  const ids = getFavoriteIds();
  ids.add(String(projectId));
  setUserIds(FAVORITES_KEY, ids);
};

export const moveToTrash = (projectId) => {
  const trash = getTrashIds();
  trash.add(String(projectId));
  setUserIds(TRASH_KEY, trash);

  const favorites = getFavoriteIds();
  favorites.delete(String(projectId));
  setUserIds(FAVORITES_KEY, favorites);
};

export const restoreFromTrash = (projectId) => {
  const trash = getTrashIds();
  trash.delete(String(projectId));
  setUserIds(TRASH_KEY, trash);
};

export const removeFromTrash = (projectId) => {
  const trash = getTrashIds();
  trash.delete(String(projectId));
  setUserIds(TRASH_KEY, trash);
};

export const clearAllTrashIds = () => {
  const ids = [...getTrashIds()];
  setUserIds(TRASH_KEY, new Set());
  return ids;
};
