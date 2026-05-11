import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

// Mengembalikan { ada_jadwal, data }
export const getMonitoringSiswa = async (token) => {
  try {
    const res = await api.get('/mobile/monitoring', { headers: headers(token) });
    return res.data; // { ada_jadwal: bool, data: [...] }
  } catch (error) {
    console.log('getMonitoringSiswa error:', error.response?.data || error.message);
    return { ada_jadwal: false, data: [] };
  }
};