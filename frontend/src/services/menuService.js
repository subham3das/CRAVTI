import api from './api';

export const fetchMenuItemsApi = async (params = {}) => {
  const response = await api.get('/menu', { params });
  return response.data;
};

export const fetchMenuStatsApi = async () => {
  const response = await api.get('/menu/stats');
  return response.data;
};

export const createMenuItemApi = async (formData) => {
  const response = await api.post('/menu', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateMenuItemApi = async (id, formData) => {
  const response = await api.put(`/menu/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteMenuItemApi = async (id) => {
  const response = await api.delete(`/menu/${id}`);
  return response.data;
};

export const duplicateMenuItemApi = async (id) => {
  const response = await api.post(`/menu/${id}/duplicate`);
  return response.data;
};

export const toggleItemAvailabilityApi = async (id) => {
  const response = await api.patch(`/menu/${id}/toggle-availability`);
  return response.data;
};

