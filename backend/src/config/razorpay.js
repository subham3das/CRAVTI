import Razorpay from 'razorpay';

/**
 * Singleton Razorpay Gateway Instance
 * Initialized strictly from environment variables.
 */
let razorpayInstance = null;

export const isRazorpayConfigured = () => {
  return Boolean(
    process.env.RAZORPAY_KEY_ID?.trim() &&
    process.env.RAZORPAY_KEY_SECRET?.trim()
  );
};

export const getRazorpayInstance = () => {
  if (razorpayInstance) {
    return razorpayInstance;
  }

  const key_id = process.env.RAZORPAY_KEY_ID?.trim();
  const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!key_id || !key_secret) {
    throw new Error(
      'Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env'
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

