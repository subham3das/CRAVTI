/**
 * Production Environment Validator
 * Enforces critical secrets and configurations before server boot.
 */
export const validateEnv = () => {
  const required = [
    { key: 'MONGODB_URI', description: 'MongoDB connection string' },
    { key: 'JWT_SECRET', description: 'HMAC signature secret for auth tokens' },
    { key: 'PORT', description: 'Application port', default: '5001' },
    { key: 'CLIENT_URL', description: 'Frontend client origin for CORS', default: 'http://localhost:5173' },
  ];

  const missing = [];

  for (const item of required) {
    if (!process.env[item.key]) {
      if (item.default) {
        process.env[item.key] = item.default;
        console.warn(`⚠️ [Config] Missing ${item.key}. Defaulted to ${item.default}`);
      } else {
        missing.push(`${item.key} (${item.description})`);
      }
    }
  }

  // Ensure JWT expiry is set
  if (!process.env.JWT_EXPIRES && !process.env.JWT_EXPIRES_IN) {
    process.env.JWT_EXPIRES_IN = '7d';
  }

  // Cloudinary Check
  const cloudinaryKeys = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const hasCloudinaryPlaceholders = cloudinaryKeys.some(
    (k) => !process.env[k] || process.env[k].includes('your_')
  );

  if (hasCloudinaryPlaceholders) {
    console.warn('⚠️ [Storage] Cloudinary credentials missing or placeholders. Local filesystem storage will be used as fallback.');
  }

  // Razorpay Gateway Validation (Phase 5)
  if (!process.env.RAZORPAY_MODE) {
    process.env.RAZORPAY_MODE = 'test';
  }
  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:5173';
  }
  if (!process.env.ADMIN_URL) {
    process.env.ADMIN_URL = process.env.ADMIN_CLIENT_URL || 'http://localhost:5174';
  }

  // Ensure Razorpay keys exist in process.env
  const razorpayKeys = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET'];
  for (const k of razorpayKeys) {
    if (process.env[k] === undefined) {
      missing.push(`${k} (Razorpay ${k.replace('RAZORPAY_', '').toLowerCase()})`);
    }
  }

  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim());
  if (!razorpayConfigured) {
    console.warn('ℹ️ [Razorpay] Test mode configured. Keys currently empty in .env. Fill RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET to test live checkouts.');
  } else {
    console.log(`✅ [Razorpay] Initialized in ${process.env.RAZORPAY_MODE.toUpperCase()} mode.`);
  }

  if (missing.length > 0) {
    console.error('❌ FATAL: Missing Environment Variables:');
    missing.forEach((m) => console.error(`   - ${m}`));
    console.error('Server boot aborted. Please define these in your .env file.');
    process.exit(1);
  }

  console.log('✅ Environment configuration validated successfully.');
};

