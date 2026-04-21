import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

// Mengembalikan { ada_jadwal, data }
export const getMonitoringSiswa = async (token) => {
  const res = await api.get('/mobile/monitoring', { headers: headers(token) });
  return res.data; // { ada_jadwal: bool, data: [...] }
};