import axios from 'axios';
import toast from 'react-hot-toast';
import env from '../config/env.js';

const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // When sending FormData, allow browser to automatically generate multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // STRICT TOKEN ISOLATION:
    // Customer ordering routes MUST NEVER send restaurant or admin tokens
    const isPublicCustomerRoute =
      config.url?.includes('/menu/') ||
      config.url?.includes('/order/menu') ||
      config.url?.includes('/customer') ||
      config.url?.startsWith('/orders/menu') ||
      window.location.pathname.startsWith('/order/');

    if (isPublicCustomerRoute) {
      delete config.headers.Authorization;
      return config;
    }

    // Restaurant requests ONLY use restaurantAccessToken
    const token =
      localStorage.getItem('restaurantAccessToken') ||
      localStorage.getItem('craviti_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
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
      toast.error('Network error. Connecting to Craviti production server...');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message || data?.error || '';
    const currentPath = window.location.pathname;

    switch (status) {
      case 401:
        // Unauthorized
        if (currentPath !== '/login' && currentPath !== '/signup' && !currentPath.startsWith('/order/')) {
          localStorage.removeItem('restaurantAccessToken');
          localStorage.removeItem('restaurantRefreshToken');
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
