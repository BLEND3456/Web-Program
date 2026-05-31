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
    request(`/presets/projects/${id}/preview`, {
      method: 'PATCH',
      body: JSON.stringify({ name, previewUrl }),
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
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
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