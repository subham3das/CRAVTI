import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://cravti.onrender.com/api/admin',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Admin Token & handle FormData
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token =
      localStorage.getItem('craviti_admin_token') || sessionStorage.getItem('craviti_admin_token');
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
    if (!error.response) {
      toast.error('Network error. Unable to reach Craviti admin server.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message || data?.error || '';

    if (status === 401) {
      localStorage.removeItem('craviti_admin_token');
      sessionStorage.removeItem('craviti_admin_token');
      localStorage.removeItem('craviti_admin_user');
      sessionStorage.removeItem('craviti_admin_user');
      if (window.location.pathname !== '/login') {
        toast.error('Admin session expired. Please sign in again.');
        window.location.href = '/login';
      }
    } else if (status === 403) {
      toast.error(serverMessage || 'Admin permission denied.');
    } else if (status >= 500) {
      toast.error(serverMessage || 'Server error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

export default api;
