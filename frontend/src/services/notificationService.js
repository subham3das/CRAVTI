import api from './api';

export const fetchRestaurantNotificationsApi = (params = {}) =>
  api.get('/notifications', { params }).then((res) => res.data);

export const markRestaurantNotificationReadApi = (id) =>
  api.patch(`/notifications/${id}/read`).then((res) => res.data);

export const markAllRestaurantNotificationsReadApi = () =>
  api.patch('/notifications/mark-all-read').then((res) => res.data);

