import { api, publicApi } from './api';

/**
 * Customer / Public Payment APIs (No auth headers or cookies)
 * Forwards full payload (orderId, restaurantSlug, tableId, guestSessionId, items, paymentMethod, etc.)
 */
export const createPaymentOrderApi = async (payload = {}, config = {}) => {
  const response = await publicApi.post('/payment/create-order', payload, config);
  return response.data;
};

export const verifyPaymentApi = async (payload = {}, config = {}) => {
  const response = await publicApi.post('/payment/verify', payload, config);
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

/**
 * Restaurant Panel Payments & Settlements APIs
 * Strictly tenant-isolated, production real-backend endpoints
 */
export const fetchRestaurantPaymentsSummaryApi = async () => {
  const response = await api.get('/payment/summary');
  return response.data;
};

export const fetchRestaurantPaymentsApi = async (params = {}) => {
  const response = await api.get('/payments', { params });
  return response.data;
};

export const fetchRestaurantRevenueChartApi = async (timeframe = '7days') => {
  const response = await api.get('/payment/chart', { params: { timeframe } });
  return response.data;
};

export const fetchRestaurantPaymentMethodsApi = async () => {
  const response = await api.get('/payment/methods');
  return response.data;
};

export const fetchRestaurantSettlementsApi = async () => {
  const response = await api.get('/payment/settlements');
  return response.data;
};

export const fetchRestaurantRefundsApi = async () => {
  const response = await api.get('/payment/refunds');
  return response.data;
};

export const fetchRestaurantFailedPaymentsApi = async () => {
  const response = await api.get('/payment/failed');
  return response.data;
};

export const fetchRestaurantBankDetailsApi = async () => {
  const response = await api.get('/payment/bank-details');
  return response.data;
};

export const exportRestaurantPaymentsCsvApi = async (params = {}) => {
  const response = await api.get('/payment/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
