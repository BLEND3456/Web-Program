const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

if (process.env.NODE_ENV === 'development') {
  console.info('[API] Backend:', BASE_URL);
}

const isSessionError = (status, payload = {}) => {
  const text = `${payload.message || ''} ${payload.error || ''}`.toLowerCase();
  return (
    status === 401 ||
    text.includes('userId_fkey') ||
    text.includes('сессия устарела') ||
    text.includes('токен недействителен')
  );
};

const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
};

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (isSessionError(response.status, error) && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
        clearAuthAndRedirect();
        throw new Error(error.message || 'Сессия устарела, войдите снова');
      }
      const detail = error.error ? `: ${error.error}` : '';
      throw new Error((error.message || `Ошибка: ${response.status}`) + detail);
    }
    return response.json();
  } catch (err) {
    throw new Error(err.message || 'Сервер не отвечает');
  }
}

export const authAPI = {
  register: (name, email, password) => 
    request('/auth/register', { 
      method: 'POST', 
      body: JSON.stringify({ name, email, password }) 
    }),
    
  login: (email, password) => 
    request('/auth/login', { 
      method: 'POST', 
      body: JSON.stringify({ email, password }) 
    }),
    
  resetPassword: (name, email, newPassword) => 
    request('/auth/reset-password', { 
      method: 'POST', 
      body: JSON.stringify({ name, email, newPassword }) 
    })
};

// 2. ИСПРАВЛЕННЫЙ БЛОК ПРОЕКТОВ (projectsAPI)
export const projectsAPI = {
  getAll: () => request('/presets/projects'),
  getById: (id) => request(`/presets/projects/${id}`),
  create: (data) => request('/presets/projects', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  save: (id, data) => request(`/presets/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  savePreview: (id, { name, previewUrl }) =>
    request(`/presets/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, previewUrl }),
    }),
  delete: (id) => request(`/presets/projects/${id}`, { method: 'DELETE' }),
};

// 3. БЛОК ПРЕСЕТОВ (designPresetsAPI)
const getCurrentUserId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    if (stored?.id) return stored.id;
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId ?? null;
  } catch {
    return null;
  }
};

export const designPresetsAPI = {
  getAll: () => request('/presets/design-presets'),
  getMine: async () => {
    const endpoints = ['/presets/my-design-presets', '/presets/design-presets/mine'];
    for (const endpoint of endpoints) {
      try {
        return await request(endpoint);
      } catch {
        // пробуем следующий маршрут
      }
    }

    const userId = getCurrentUserId();
    const all = await request('/presets/design-presets');
    if (!userId) return all;
    const mine = all.filter((p) => p.userId === userId);
    return mine.length > 0 ? mine : all;
  },
  getById: (id) => request(`/presets/design-presets/${id}`),
  create: (data) => request('/presets/design-presets', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// 4. БЛОК ЭКСПОРТА (exportAPI)
export const exportAPI = {
  generatePDF: (projectId) => {
    const token = localStorage.getItem('token');
    const url = `${BASE_URL}/export/pdf/${projectId}`;
    const headers = {
      'Authorization': `Bearer ${token}`,
    };
    
    return fetch(url, { method: 'POST', headers })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (isSessionError(res.status, err)) clearAuthAndRedirect();
          throw new Error(err.message || 'Ошибка экспорта');
        }
        return res.blob();
      })
      .then(blob => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `project-${projectId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      });
  }
};