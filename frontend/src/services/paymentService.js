import api from './api';

/**
 * Customer / Public Payment APIs
 */
export const createPaymentOrderApi = async ({
  orderId,
  customerEmail = '',
  customerPhone = '',
  guestSessionId = '',
}) => {
  const response = await api.post('/payment/create-order', {
    orderId,
    customerEmail,
    customerPhone,
    guestSessionId,
  });
  return response.data;
};

export const verifyPaymentApi = async ({
  orderId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const response = await api.post('/payment/verify', {
    orderId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  return response.data;
};

/**
 * Restaurant Settings Payment Gateway APIs
 */
export const fetchGatewayStatusApi = async () => {
  const response = await api.get('/payment/gateway-status');
  return response.data;
};

export const testGatewayConnectionApi = async () => {
  const response = await api.post('/payment/test-connection');
  return response.data;
};

export const fetchPaymentDetailsApi = async (paymentId) => {
  const response = await api.get(`/payment/${paymentId}`);
  return response.data;
};

