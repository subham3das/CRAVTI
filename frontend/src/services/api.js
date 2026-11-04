import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('craviti_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Error Handling (Standard 13)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network failure
      toast.error('Network error. Please check your internet connection.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message || data?.error || '';
    const currentPath = window.location.pathname;

    switch (status) {
      case 401:
        // Unauthorized
        if (currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/order/')) {
          localStorage.removeItem('craviti_token');
          localStorage.removeItem('craviti_user');
          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
        break;

      case 403:
        // Forbidden
        if (serverMessage && !currentPath.startsWith('/order/')) {
          toast.error(serverMessage || 'Access denied.');
        }
        break;

      case 404:
        // Not Found
        // Don't toast 404 for silent background active-session checks
        if (!error.config?.url?.includes('active-session') && serverMessage) {
          console.warn(`[API 404] Resource not found: ${error.config?.url}`);
        }
        break;

      case 422:
        // Unprocessable Entity / Validation
        toast.error(serverMessage || 'Validation failed. Please check form values.');
        break;

      case 429:
        // Rate Limited
        toast.error('Too many requests. Please slow down and try again shortly.');
        break;

      case 500:
      default:
        if (status >= 500) {
          toast.error(serverMessage || 'Internal server error. Please try again later.');
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
