import axios from 'axios';
import toast from 'react-hot-toast';
import env from '../config/env.js';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach Admin Token & route normalization
api.interceptors.request.use(
  (config) => {
    // Ensure all admin endpoints route to /admin/... without duplication
    const base = config.baseURL || env.API_BASE_URL || '';
    if (base.endsWith('/admin')) {
      if (config.url?.startsWith('/admin/')) {
        config.url = config.url.replace(/^\/admin/, '');
      }
    } else {
      if (config.url && !config.url.startsWith('/admin') && !config.url.startsWith('http')) {
        config.url = `/admin${config.url.startsWith('/') ? '' : '/'}${config.url}`;
      }
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // STRICT TOKEN ISOLATION: Admin requests MUST ONLY use adminAccessToken
    const token =
      localStorage.getItem('adminAccessToken') ||
      sessionStorage.getItem('adminAccessToken') ||
      localStorage.getItem('craviti_admin_token') ||
      sessionStorage.getItem('craviti_admin_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
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
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      sessionStorage.removeItem('adminAccessToken');
      sessionStorage.removeItem('adminRefreshToken');
      sessionStorage.removeItem('adminUser');
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
