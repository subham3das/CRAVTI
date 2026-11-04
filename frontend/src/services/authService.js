import api from './api';

export const signupApi = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const loginApi = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getMeApi = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

