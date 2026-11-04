import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api/admin',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Admin Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('craviti_admin_token') || sessionStorage.getItem('craviti_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Global error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('craviti_admin_token');
      sessionStorage.removeItem('craviti_admin_token');
      localStorage.removeItem('craviti_admin_user');
      sessionStorage.removeItem('craviti_admin_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

