import api from './api';

export const fetchRestaurantFinanceOverviewApi = () =>
  api.get('/finance/overview').then((res) => res.data);

export const fetchRestaurantSettlementsApi = (params = {}) =>
  api.get('/finance/settlements', { params }).then((res) => res.data);

export const fetchRestaurantInvoicesApi = () =>
  api.get('/finance/invoices').then((res) => res.data);

export const fetchRestaurantTransactionsApi = (params = {}) =>
  api.get('/finance/transactions', { params }).then((res) => res.data);

export const exportRestaurantSettlementReportApi = (params = {}) =>
  api.get('/finance/reports/export', { params, responseType: 'blob' }).then((res) => res.data);

