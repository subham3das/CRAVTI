import api from './api';

export const onboardRestaurantApi = async (formData) => {
  const response = await api.post('/restaurants/onboard', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getMyRestaurantApi = async () => {
  const response = await api.get('/restaurants/my-restaurant');
  return response.data;
};

export const getProfileApi = async () => {
  const response = await api.get('/profile');
  return response.data;
};

export const updateProfileApi = async (formData) => {
  const response = await api.put('/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

