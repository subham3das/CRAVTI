import Razorpay from 'razorpay';
import env from './env.js';

/**
 * Singleton Razorpay Gateway Instance
 * Initialized strictly from environment variables.
 */
let razorpayInstance = null;

export const isRazorpayConfigured = () => {
  return Boolean(
    env.RAZORPAY_KEY_ID?.trim() &&
    env.RAZORPAY_KEY_SECRET?.trim()
  );
};

export const getRazorpayInstance = () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const key_id = env.RAZORPAY_KEY_ID?.trim();
  const key_secret = env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    throw new Error(
      'Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment or .env'
    );
  }

  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  });

  return razorpayInstance;
};

// Lazy getter / Proxy export for singleton instance
export const razorpay = new Proxy({}, {
  get(target, prop) {
    const instance = getRazorpayInstance();
    const value = instance[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

export default razorpay;
