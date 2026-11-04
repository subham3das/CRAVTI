import api from './api';

export const fetchSettingsApi = () =>
  api.get('/settings').then((r) => r.data);

export const updateSettingsApi = (data) =>
  api.put('/settings', data).then((r) => r.data);

export const fetchBusinessHoursApi = () =>
  api.get('/settings/business-hours').then((r) => r.data);

export const updateBusinessHoursApi = (data) =>
  api.put('/settings/business-hours', data).then((r) => r.data);

export const fetchPaymentSettingsApi = () =>
  api.get('/settings/payments').then((r) => r.data);

export const updatePaymentSettingsApi = (data) =>
  api.put('/settings/payments', data).then((r) => r.data);

export const fetchReceiptApi = (orderId) =>
  api.get(`/settings/receipt/${orderId}`).then((r) => r.data);

