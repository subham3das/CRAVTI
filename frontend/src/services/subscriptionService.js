import { api } from './api';

/**
 * Restaurant Subscription APIs (Phase 1)
 */

export const fetchSubscriptionStatusApi = () =>
  api.get('/subscription/status').then((r) => r.data);

export const createSubscriptionApi = (data = {}) =>
  api.post('/subscription/create', data).then((r) => r.data);

export const confirmSubscriptionApi = (data = {}) =>
  api.post('/subscription/confirm', data).then((r) => r.data);

export const renewSubscriptionApi = (data = {}) =>
  api.post('/subscription/renew', data).then((r) => r.data);

export const cancelSubscriptionApi = (data = {}) =>
  api.post('/subscription/cancel', data).then((r) => r.data);

export default {
  fetchSubscriptionStatusApi,
  createSubscriptionApi,
  confirmSubscriptionApi,
  renewSubscriptionApi,
  cancelSubscriptionApi,
};

