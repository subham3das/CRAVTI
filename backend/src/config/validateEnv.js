/**
 * Production Environment Validator (Craviti Standards)
 * Validates critical infrastructure variables before server initialization.
 */
export const validateEnv = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing = [];
  const warnings = [];

  // Core Infrastructure Variables
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    warnings.push('NODE_ENV was not set. Defaulted to "development".');
  }

  if (!process.env.PORT) {
    process.env.PORT = '5001';
    warnings.push('PORT was not set. Defaulted to 5001.');
  }

  // Database Connection (Supports either MONGO_URI or MONGODB_URI)
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    missing.push('MONGO_URI / MONGODB_URI (MongoDB Atlas connection string)');
  } else {
    // Normalize so both variables are accessible
    process.env.MONGO_URI = mongoUri;
    process.env.MONGODB_URI = mongoUri;
  }

  // Security & Authentication
  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET (Cryptographic signing key for JWT auth tokens)');
  }

  if (!process.env.JWT_EXPIRES_IN && !process.env.JWT_EXPIRE) {
    process.env.JWT_EXPIRES_IN = '7d';
  }

  // Client Frontend URLs
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
  if (!clientUrl && isProduction) {
    missing.push('CLIENT_URL / FRONTEND_URL (Frontend domain for CORS and QR code links)');
  } else if (!clientUrl) {
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.FRONTEND_URL = 'http://localhost:5173';
  }

  // Cloudinary Storage
  const cloudinaryKeys = [
    { key: 'CLOUDINARY_CLOUD_NAME', desc: 'Cloudinary cloud identifier' },
    { key: 'CLOUDINARY_API_KEY', desc: 'Cloudinary API key' },
    { key: 'CLOUDINARY_API_SECRET', desc: 'Cloudinary API secret' },
  ];

  for (const item of cloudinaryKeys) {
    const val = process.env[item.key];
    if (!val || val.includes('YOUR_')) {
      if (isProduction) {
        missing.push(`${item.key} (${item.desc})`);
      } else {
        warnings.push(`${item.key} is not set. Local filesystem storage will be used.`);
      }
    }
  }

  // Razorpay Gateway
  if (!process.env.RAZORPAY_MODE) {
    process.env.RAZORPAY_MODE = isProduction ? 'live' : 'test';
  }

  const razorpayKeys = [
    { key: 'RAZORPAY_KEY_ID', desc: 'Razorpay Key ID' },
    { key: 'RAZORPAY_KEY_SECRET', desc: 'Razorpay Key Secret' },
    { key: 'RAZORPAY_WEBHOOK_SECRET', desc: 'Razorpay Webhook Secret (HMAC SHA256 Signature Verification)' },
  ];

  for (const item of razorpayKeys) {
    const val = process.env[item.key];
    if (!val || val.includes('YOUR_')) {
      if (isProduction && item.key !== 'RAZORPAY_WEBHOOK_SECRET') {
        missing.push(`${item.key} (${item.desc})`);
      } else if (isProduction && item.key === 'RAZORPAY_WEBHOOK_SECRET') {
        warnings.push(`${item.key} is not configured in production. Webhook signature verification will reject incoming webhooks.`);
      } else {
        warnings.push(`${item.key} is missing. Payment test orders will run in mock mode and webhooks require local mock secret.`);
      }
    }
  }

  // Email (SMTP)
  const smtpKeys = [
    { key: 'SMTP_HOST', desc: 'SMTP Mail Server Host (e.g. smtp.gmail.com)' },
    { key: 'SMTP_USER', desc: 'SMTP Mail Server Username' },
    { key: 'SMTP_PASS', desc: 'SMTP Mail Server Password / App Password' },
  ];

  for (const item of smtpKeys) {
    const val = process.env[item.key];
    if (!val || val.includes('YOUR_')) {
      if (isProduction) {
        missing.push(`${item.key} (${item.desc})`);
      } else {
        warnings.push(`${item.key} is missing. Outbound email verification will be skipped.`);
      }
    }
  }

  // Report Warnings
  if (warnings.length > 0) {
    warnings.forEach((w) => console.warn(`⚠️ [Config Warning] ${w}`));
  }

  // Abort if Required Keys Missing
  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('❌ FATAL: CRITICAL ENVIRONMENT VARIABLES MISSING');
    console.error('======================================================');
    missing.forEach((m) => console.error(`  - ${m}`));
    console.error('======================================================');
    console.error('Server boot aborted. Please configure these variables in your environment or .env file.\n');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated successfully.');
};

export default validateEnv;
