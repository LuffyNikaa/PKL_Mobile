import api from './api';

export const getDudi = async () => {
  try {
    const response = await api.get('/mobile/dudi');
    return response.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};
