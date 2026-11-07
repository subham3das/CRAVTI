import api from './api';

export const fetchCustomerMenuApi = (restaurantSlug, tableId, guestId, deviceId, token = '') => {
  const url = tableId
    ? `/order/menu/${restaurantSlug}/${tableId}`
    : `/order/menu/${restaurantSlug}`;

  return api
    .get(url, {
      params: {
        guestId,
        deviceId,
        ...(token ? { token } : {}),
        _t: Date.now(), // Anti-cache parameter ensures live production DB records
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    })
    .then((r) => r.data);
};

export const fetchCustomerCategoriesApi = (restaurantSlug) =>
  api
    .get(`/customer/categories/${restaurantSlug}`, {
      params: { _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
    .then((r) => r.data);

export const fetchCustomerMenuItemsApi = (restaurantSlug, params = {}) =>
  api
    .get(`/customer/menu-items/${restaurantSlug}`, {
      params: { ...params, _t: Date.now() },
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
    })
    .then((r) => r.data);

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
