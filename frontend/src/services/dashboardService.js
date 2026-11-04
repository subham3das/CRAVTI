import api from './api';

/**
 * Fetch production live dashboard metrics for the authenticated restaurant owner.
 * GET /api/dashboard
 */
export const fetchDashboardApi = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

