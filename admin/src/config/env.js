/**
 * Centralized Admin Environment Configuration
 * Single Source of Truth for all import.meta.env variables in Admin.
 */

const normalizeApiBaseUrl = (url, fallback) => {
  if (!url || typeof url !== 'string') return fallback;
  // Ensure BASE_URL points to https://<RENDER_BACKEND_URL>/api
  return url.replace(/\/+$/, '').replace(/\/admin$/, '');
};

const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://cravti.onrender.com/api';

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (rawApiUrl ? rawApiUrl.replace(/\/api.*$/, '') : 'https://cravti.onrender.com');

export const env = Object.freeze({
  API_BASE_URL: normalizeApiBaseUrl(rawApiUrl, 'https://cravti.onrender.com/api'),
  SOCKET_URL: rawSocketUrl ? rawSocketUrl.replace(/\/+$/, '') : 'https://cravti.onrender.com',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Craviti Admin',
  APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'production',
  IS_PRODUCTION: import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production',
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'admin@craviti.com',
  RESTAURANT_URL: import.meta.env.VITE_RESTAURANT_URL || '',
});

export default env;
