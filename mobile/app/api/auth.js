import api from './api';

export const registerSiswa = async (data) => {
  try {
    const response = await api.post('/mobile/register', data);
    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};

export const loginSiswa = async (email, password) => {
  try {
    const response = await api.post('/login/mobile', { email, password });
    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};
