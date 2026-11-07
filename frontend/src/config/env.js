/**
 * Centralized Frontend Environment Configuration
 * Single Source of Truth for all import.meta.env variables in Frontend.
 */

const normalizeUrl = (url, fallback) => {
  if (!url || typeof url !== 'string') return fallback;
  return url.replace(/\/+$/, '');
};

const rawApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://cravti.onrender.com/api';

const rawSocketUrl =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (rawApiUrl ? rawApiUrl.replace(/\/api.*$/, '') : 'https://cravti.onrender.com');

const rawWebsiteUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WEBSITE_URL) ||
  import.meta.env.VITE_PUBLIC_WEBSITE_URL ||
  import.meta.env.NEXT_PUBLIC_WEBSITE_URL ||
  import.meta.env.VITE_WEBSITE_URL ||
  'https://cravti-rsvm.vercel.app';

export const env = Object.freeze({
  API_BASE_URL: normalizeUrl(rawApiUrl, 'https://cravti.onrender.com/api'),
  SOCKET_URL: normalizeUrl(rawSocketUrl, 'https://cravti.onrender.com'),
  WEBSITE_URL: normalizeUrl(rawWebsiteUrl, 'https://cravti-rsvm.vercel.app'),
  PUBLIC_WEBSITE_URL: normalizeUrl(rawWebsiteUrl, 'https://cravti-rsvm.vercel.app'),
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Craviti',
  APP_ENV: import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'production',
  IS_PRODUCTION: import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  PAYMENT_PROVIDER: import.meta.env.VITE_PAYMENT_PROVIDER || 'razorpay',
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || 'support@craviti.com',
  RESTAURANT_URL: import.meta.env.VITE_RESTAURANT_URL || '',
  ADMIN_URL: import.meta.env.VITE_ADMIN_URL || '',
});

export default env;
