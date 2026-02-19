import api from './api';

export const getProfileSiswa = async (token) => {
  try {
    const response = await api.get('/mobile/siswa/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.data;
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};
