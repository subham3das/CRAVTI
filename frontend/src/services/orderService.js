import { api, publicApi } from './api';

/**
 * Public Customer Ordering APIs (No authentication headers, no cookies)
 */
export const fetchCustomerMenuApi = (restaurantSlug, tableId, guestId, deviceId, token = '') => {
  const url = tableId
    ? `/order/menu/${restaurantSlug}/${tableId}`
    : `/order/menu/${restaurantSlug}`;

  const params = {};
  if (guestId) params.guestId = guestId;
  if (deviceId) params.deviceId = deviceId;
  if (token) params.token = token;

  return publicApi.get(url, { params }).then((r) => r.data);
};

export const fetchCustomerCategoriesApi = (restaurantSlug) =>
  publicApi.get(`/customer/categories/${restaurantSlug}`).then((r) => r.data);

export const fetchCustomerMenuItemsApi = (restaurantSlug, params = {}) =>
  publicApi.get(`/customer/menu-items/${restaurantSlug}`, { params }).then((r) => r.data);

export const fetchActiveCustomerOrderApi = (restaurantSlug, tableId, guestId, deviceId) =>
  publicApi
    .get(`/order/active-session/${restaurantSlug}/${tableId}`, {
      params: { guestId, deviceId },
    })
    .then((r) => r.data);

export const placeCustomerOrderApi = (orderData) =>
  publicApi.post('/order/place', orderData).then((r) => r.data);

export const fetchCustomerOrderTrackApi = (orderId) =>
  publicApi.get(`/order/track/${orderId}`).then((r) => r.data);

export const fetchOrderReceiptApi = (orderId) =>
  publicApi.get(`/order/receipt/${orderId}`).then((r) => r.data);

/**
 * Authenticated Restaurant Management APIs
 */

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
