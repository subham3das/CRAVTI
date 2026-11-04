/**
 * Centralized Backend Environment Configuration
 * Single Source of Truth for all process.env variables.
 */
export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  PORT: parseInt(process.env.PORT || '5001', 10),
  TZ: process.env.TZ || 'Asia/Kolkata',

  // Database
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/craviti',
  MONGODB_URI: process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/craviti',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'craviti_production_secret_fallback_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || '7d',

  // Client URLs
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  ADMIN_CLIENT_URL: process.env.ADMIN_CLIENT_URL || process.env.ADMIN_URL || 'http://localhost:5174',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || process.env.ADMIN_CLIENT_URL || 'http://localhost:5174',

  // Socket
  SOCKET_CORS_ORIGIN: process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL || '*',

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  RAZORPAY_MODE: process.env.RAZORPAY_MODE || 'test',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // SMTP Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'Craviti <noreply@craviti.com>',

  // OTP
  OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Feature Flags
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS !== 'false',
  ENABLE_RECEIPTS: process.env.ENABLE_RECEIPTS !== 'false',
  ENABLE_QR: process.env.ENABLE_QR !== 'false',
  ENABLE_NOTIFICATIONS: process.env.ENABLE_NOTIFICATIONS !== 'false',
});

export default env;
