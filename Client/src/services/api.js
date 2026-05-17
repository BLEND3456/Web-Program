const BASE_URL = 'https://newspaper-backend-u2ja.onrender.com/api'; // Используем порт 4000

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
      throw new Error(error.message || `Ошибка: ${response.status}`);
    }
    return response.json();
  } catch (err) {
    throw new Error(err.message || 'Сервер не отвечает');
  }
}

// 1. ВОССТАНОВЛЕННЫЙ БЛОК АВТОРИЗАЦИИ (authAPI)
export const authAPI = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  // Добавляем вот этот кусок:
  resetPassword: async (name, email, newPassword) => {
    const response = await api.post('/auth/reset-password', { name, email, newPassword });
    return response.data;
  }
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
    body: JSON.stringify(data), // Ожидает { designSettings: ... }
  }),
  delete: (id) => request(`/presets/projects/${id}`, { method: 'DELETE' }),
};

// 3. БЛОК ПРЕСЕТОВ (designPresetsAPI)
export const designPresetsAPI = {
  getAll: () => request('/presets/design-presets'),
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
      .then(res => {
        if (!res.ok) throw new Error('Ошибка экспорта');
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