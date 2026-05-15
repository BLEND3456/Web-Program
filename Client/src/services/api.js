const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Ошибка: ${response.status}`);
  }

  return response.json();
}

export const authAPI = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
};

export const projectsAPI = {
  getAll: () => request('/presets/projects'),
  getById: (id) => request(`/presets/projects/${id}`),
  create: (data) => request('/presets/projects', { 
    method: 'POST',
    body: JSON.stringify(data),
  }),
  save: (id, canvasJSON) =>
    request(`/presets/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ canvasJSON }),
    }),
  delete: (id) => request(`/presets/projects/${id}`, { method: 'DELETE' }),
};

export const designPresetsAPI = {
  getAll: () => request('/presets/design-presets'),
  getById: (id) => request(`/presets/design-presets/${id}`),
  create: (data) => request('/presets/design-presets', { 
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

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