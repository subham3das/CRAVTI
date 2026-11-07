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

/**
 * Safely inspect JWT expiration without throwing
 */
const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    // Check if token expiration (with 10-second buffer) is in the past
    return Date.now() >= (payload.exp - 10) * 1000;
  } catch {
    return false;
  }
};

/**
 * Helper to identify public customer ordering routes
 * Never strips tokens from restaurant admin endpoints (/menu, /orders, /categories, etc.)
 */
const isPublicCustomerRoute = (url, pathname = '') => {
  if (typeof pathname === 'string' && pathname.startsWith('/order/')) {
    return true;
  }
  if (typeof url === 'string') {
    // Only customer ordering API endpoints start with /order/ (singular)
    if (url.startsWith('/order/')) return true;
  }
  return false;
};

api.interceptors.request.use(
  (config) => {
    // When sending FormData, allow browser to automatically generate multipart boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublicCustomer = isPublicCustomerRoute(config.url, currentPath);

    // STRICT TOKEN ISOLATION:
    // Only customer ordering routes omit authentication headers
    if (isPublicCustomer) {
      delete config.headers.Authorization;
      return config;
    }

    // Restaurant requests MUST use restaurantAccessToken (or craviti_token fallback)
    const token =
      localStorage.getItem('restaurantAccessToken') ||
      localStorage.getItem('craviti_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    // Diagnostic logging for development & troubleshooting
    if (import.meta.env?.DEV || (typeof window !== 'undefined' && window.__CRAVITI_DEBUG__)) {
      console.debug('[Restaurant API Request]', {
        url: config.url,
        method: config.method,
        hasToken: !!token,
        authAttached: !!config.headers.Authorization,
        storageKey: token ? 'restaurantAccessToken' : 'none',
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global Axios Error Handling (Standard 13)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      // Network failure
      toast.error('Network error. Connecting to Craviti production server...');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const serverMessage = data?.message || data?.error || '';
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const originalRequest = error.config;

    switch (status) {
      case 401: {
        const currentToken =
          localStorage.getItem('restaurantAccessToken') ||
          localStorage.getItem('craviti_token');

        console.warn('[Restaurant API 401 Unauthorized]', {
          url: originalRequest?.url,
          currentPath,
          hasToken: !!currentToken,
          tokenExpired: isTokenExpired(currentToken),
          isRetry: !!originalRequest?._retry,
          serverMessage,
        });

        // 1. Never logout or redirect on public customer routes or public auth pages
        if (currentPath === '/login' || currentPath === '/signup' || currentPath.startsWith('/order/')) {
          break;
        }

        // 2. Defensive Retry: If request hasn't been retried yet, and we have a valid, unexpired token,
        // re-attach the Authorization header and retry once instead of immediately logging out.
        if (originalRequest && !originalRequest._retry && currentToken && !isTokenExpired(currentToken)) {
          originalRequest._retry = true;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${currentToken}`;
          console.info('[Restaurant API] Retrying request once with active token...', originalRequest.url);
          return api(originalRequest);
        }

        // 3. Genuine Session Expiration: Only logout if retry also failed or token is genuinely missing / expired
        if (originalRequest?._retry || !currentToken || isTokenExpired(currentToken)) {
          console.error('[Restaurant Auth] Genuine session expiration detected. Logging out.', {
            triggerSource: 'Axios 401 Interceptor',
            url: originalRequest?.url,
            storageKey: currentToken ? 'restaurantAccessToken (expired/rejected)' : 'none',
          });

          localStorage.removeItem('restaurantAccessToken');
          localStorage.removeItem('restaurantRefreshToken');
          localStorage.removeItem('craviti_token');
          localStorage.removeItem('craviti_user');

          toast.error('Session expired. Please log in again.');
          window.location.href = '/login';
        }
        break;
      }

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
