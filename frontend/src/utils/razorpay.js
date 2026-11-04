/**
 * Razorpay Checkout SDK Loader & Runtime Handler
 * Dynamically injects script and manages modal callbacks.
 */
import env from '../config/env.js';

let scriptPromise = null;

export const loadRazorpayScript = () => {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
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
    onError && onError(new Error('Failed to load Razorpay payment gateway. Please check your internet connection.'));
    return;
  }

  const options = {
    key: orderData.keyId || env.RAZORPAY_KEY_ID || '',
    amount: orderData.amountInPaise,
    currency: orderData.currency || 'INR',
    name: orderData.restaurantName || 'Craviti Dining',
    description: orderData.description || `Order #${orderData.orderNumber}`,
    order_id: orderData.razorpayOrderId,
    prefill: {
      name: orderData.prefill?.name || 'Guest',
      email: orderData.prefill?.email || '',
      contact: orderData.prefill?.contact || '',
    },
    notes: {
      orderId: String(orderData.orderId),
      orderNumber: String(orderData.orderNumber),
    },
    theme: {
      color: '#16A34A', // Craviti Emerald
    },
    modal: {
      ondismiss: () => {
        onDismiss && onDismiss();
      },
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
      onError && onError(resp.error || new Error('Payment failed'));
    });
    rzp.open();
  } catch (err) {
    onError && onError(err);
  }
};

