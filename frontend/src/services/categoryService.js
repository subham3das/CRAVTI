import api from './api';

export const fetchCategoriesApi = async () => {
  const response = await api.get('/categories');
  return response.data;
};

export const createCategoryApi = async (categoryData) => {
  const response = await api.post('/categories', categoryData);
  return response.data;
};

export const updateCategoryApi = async (id, categoryData) => {
  const response = await api.put(`/categories/${id}`, categoryData);
  return response.data;
};

export const deleteCategoryApi = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export const toggleCategoryStatusApi = async (id) => {
  const response = await api.patch(`/categories/${id}/toggle-status`);
  return response.data;
};

