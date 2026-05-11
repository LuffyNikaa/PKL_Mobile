import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const getPresentasiSiswa = async (token) => {
  try {
    const res = await api.get('/mobile/presentasi', { headers: headers(token) });
    return res.data; // { ada_jadwal, data }
  } catch (error) {
    console.log('getPresentasiSiswa error:', error.response?.data || error.message);
    return { ada_jadwal: false, data: [] };
  }
};