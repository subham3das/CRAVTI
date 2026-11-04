/**
 * Centralized Public Website Environment Configuration
 * Single Source of Truth for all process.env variables in Public Website.
 */

const normalizeUrl = (url: string | undefined, fallback: string): string => {
  if (!url || typeof url !== 'string') return fallback;
  return url.replace(/\/+$/, '');
};

export const env = Object.freeze({
  API_URL: normalizeUrl(
    process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL,
    'https://cravti.onrender.com/api'
  ),
  WEBSITE_URL: normalizeUrl(process.env.NEXT_PUBLIC_WEBSITE_URL, 'https://craviti.com'),
  SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@craviti.com',
  COMPANY_NAME: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Craviti',
  PHONE: process.env.NEXT_PUBLIC_PHONE || '+91 (800) 272-8484',
  RAZORPAY_KEY: process.env.NEXT_PUBLIC_RAZORPAY_KEY || '',
  APP_URL: normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    'https://cravti.vercel.app'
  ),
  ADMIN_URL: normalizeUrl(
    process.env.NEXT_PUBLIC_ADMIN_URL,
    'https://cravti-admin.vercel.app'
  ),
  SOCKET_URL: normalizeUrl(
    process.env.NEXT_PUBLIC_SOCKET_URL,
    'https://cravti.onrender.com'
  ),
});

export default env;
