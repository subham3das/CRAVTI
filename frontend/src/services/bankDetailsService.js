import api from './api';

export const fetchBankDetailsApi = () =>
  api.get('/settings/bank-details').then((r) => r.data);

export const saveBankDetailsDraftApi = (data) =>
  api.put('/settings/bank-details', data).then((r) => r.data);

export const submitBankDetailsApi = (data) =>
  api.post('/settings/bank-details/submit', data).then((r) => r.data);

export const fetchBankStatusApi = () =>
  api.get('/settings/bank-details/status').then((r) => r.data);

export const uploadBankDocApi = (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  return api
    .post('/settings/bank-details/upload-doc', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
    .then((r) => r.data);
};

