/**
 * Razorpay Checkout SDK Loader & Runtime Handler
 * Dynamically injects script and manages modal callbacks with deterministic logging.
 */
import env from '../config/env.js';

let scriptPromise = null;

export const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    // Check if script element was already injected
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      if (typeof window !== 'undefined' && window.Razorpay) {
        return resolve(true);
      }
      existing.addEventListener('load', () => {
        resolve(true);
      });
      existing.addEventListener('error', (err) => {
        console.error('[Razorpay Flow] Failed to load SDK:', err);
        scriptPromise = null;
        resolve(false);
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      resolve(true);
    };
    script.onerror = (err) => {
      console.error('[Razorpay Flow] SDK script load error:', err);
      scriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Open Razorpay Checkout Dialog
 */
export const openRazorpayModal = async ({
  orderData,
  onSuccess,
  onDismiss,
  onError,
}) => {
  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    const sdkErr = new Error('Failed to load Razorpay payment gateway. Please check your internet connection.');
    console.error('[Razorpay Flow] SDK Error:', sdkErr.message);
    onError && onError(sdkErr);
    return;
  }

  const key = orderData.key || orderData.keyId || env.RAZORPAY_KEY_ID || '';
  if (!key) {
    const keyErr = new Error('Payment gateway key is not available. Please contact restaurant staff.');
    console.error('[Razorpay Flow] Key Error:', keyErr.message);
    onError && onError(keyErr);
    return;
  }

  const options = {
    key,
    amount: orderData.amountInPaise || Math.round((Number(orderData.amount) || 0) * 100),
    currency: orderData.currency || 'INR',
    name: orderData.restaurantName || 'Craviti Dining',
    description: orderData.description || (orderData.orderNumber ? `Order #${orderData.orderNumber}` : 'Dining Order Checkout'),
    order_id: orderData.razorpayOrderId,
    prefill: {
      name: orderData.prefill?.name || 'Guest',
      email: orderData.prefill?.email || '',
      contact: orderData.prefill?.contact || '',
    },
    notes: {
      orderId: orderData.orderId ? String(orderData.orderId) : '',
      orderNumber: orderData.orderNumber ? String(orderData.orderNumber) : '',
      razorpayOrderId: String(orderData.razorpayOrderId || ''),
    },
    theme: {
      color: '#16A34A', // Craviti Emerald
    },
    modal: {
      ondismiss: () => {
        onDismiss && onDismiss();
      },
      escape: true,
      backdropclose: false,
    },
    handler: (response) => {
      onSuccess &&
        onSuccess({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
    },
  };

  try {
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (resp) => {
      console.error('[Razorpay Flow] Payment Failed event:', resp.error);
      onError && onError(resp.error || new Error('Payment failed at checkout'));
    });
    rzp.open();
  } catch (err) {
    console.error('[Razorpay Flow] Exception opening checkout:', err);
    onError && onError(err);
  }
};

export default openRazorpayModal;
