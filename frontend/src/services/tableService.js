import api from './api.js';

export const fetchTablesApi = (params = {}) =>
  api.get('/tables', { params }).then(r => r.data);

export const fetchTableStatsApi = () =>
  api.get('/tables/stats').then(r => r.data);

export const createTableApi = (data) =>
  api.post('/tables', data).then(r => r.data);

export const bulkCreateTablesApi = (data) =>
  api.post('/tables/bulk', data).then(r => r.data);

export const updateTableApi = (id, data) =>
  api.put(`/tables/${id}`, data).then(r => r.data);

export const deleteTableApi = (id) =>
  api.delete(`/tables/${id}`).then(r => r.data);

export const toggleTableActiveApi = (id) =>
  api.patch(`/tables/${id}/toggle`).then(r => r.data);

export const regenerateQRApi = (id) =>
  api.post(`/tables/${id}/regenerate`).then(r => r.data);

export const exportQRZipApi = async () => {
  const res = await api.get('/tables/export', { responseType: 'blob' });
  const url = window.URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'craviti-qr-codes.zip';
  a.click();
  window.URL.revokeObjectURL(url);
};

