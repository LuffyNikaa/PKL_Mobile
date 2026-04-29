import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const getPresentasiSiswa = async (token) => {
  const res = await api.get('/mobile/presentasi', { headers: headers(token) });
  return res.data; // { ada_jadwal, data }
};