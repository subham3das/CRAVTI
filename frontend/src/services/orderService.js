import api from './api';

export const fetchCustomerMenuApi = (restaurantSlug, tableId, guestId, deviceId, token = '') =>
  api.get(`/order/menu/${restaurantSlug}/${tableId}`, {
    params: {
      guestId,
      deviceId,
      ...(token ? { token } : {}),
    },
  }).then(r => r.data);

export const fetchActiveCustomerOrderApi = (restaurantSlug, tableId, guestId, deviceId) =>
  api.get(`/order/active-session/${restaurantSlug}/${tableId}`, {
    params: { guestId, deviceId },
  }).then(r => r.data);

export const placeCustomerOrderApi = (orderData) =>
  api.post('/order/place', orderData).then(r => r.data);

export const fetchCustomerOrderTrackApi = (orderId) =>
  api.get(`/order/track/${orderId}`).then(r => r.data);

export const fetchOrderReceiptApi = (orderId) =>
  api.get(`/order/receipt/${orderId}`).then(r => r.data);

export const updateOrderStatusApi = (orderId, status, note = '') =>
  api.patch(`/orders/${orderId}/status`, { status, note }).then(r => r.data);

export const updateOrderPaymentStatusApi = (orderId, paymentStatus, paymentMethod = 'cash', note = '') =>
  api.patch(`/orders/${orderId}/payment`, { paymentStatus, paymentMethod, note }).then(r => r.data);

export const fetchLiveOrdersApi = (params = {}) =>
  api.get('/orders/live', { params }).then(r => r.data);

export const fetchHistoricalOrdersApi = (params = {}) =>
  api.get('/orders/history', { params }).then(r => r.data);

export const fetchOrderMetricsApi = () =>
  api.get('/orders/metrics').then(r => r.data);

export const softDeleteOrderApi = (orderId) =>
  api.delete(`/orders/${orderId}`).then(r => r.data);
