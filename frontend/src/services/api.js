import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

// Paper APIs
export const paperAPI = {
  getAllPapers: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/papers?${params}`);
  },
  getPaper: (id) => api.get(`/papers/${id}`),
  createPaper: (formData) => {
    return api.post('/papers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updatePaper: (id, formData) => {
    return api.put(`/papers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deletePaper: (id) => api.delete(`/papers/${id}`),
  downloadPDF: (id) => {
    return api.get(`/papers/${id}/pdf`, {
      responseType: 'blob'
    });
  },
  getMyPapers: () => api.get('/users/my-papers')
};

// Admin APIs
export const adminAPI = {
  getApprovalRequests: (status = 'pending') => 
    api.get(`/admin/approval-requests?status=${status}`),
  handleApprovalRequest: (id, action, comment = '') => 
    api.put(`/admin/approval-requests/${id}`, { action, comment }),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role })
};

// Statistics API
export const statisticsAPI = {
  getStatistics: () => api.get('/statistics')
};

export default api;
