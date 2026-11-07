import api from './api';

/**
 * Fetch production restaurant analytics metrics from GET /api/analytics
 * @param {Object} params - { period: 'today'|'yesterday'|'7days'|'30days'|'this_month'|'last_month'|'custom', startDate, endDate }
 */
export const fetchRestaurantAnalyticsApi = async (params = {}) => {
  const response = await api.get('/analytics', { params });
  return response.data;
};

/**
 * Download CSV report from GET /api/analytics/export
 */
export const exportAnalyticsReportApi = async (params = {}) => {
  const response = await api.get('/analytics/export', {
    params: { ...params, format: 'csv' },
    responseType: 'blob',
  });
  return response.data;
};

