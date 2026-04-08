import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const getJurnalHarian = async (token, search = '') => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await api.get(`/mobile/jurnal-harian${params}`, { headers: headers(token) });
  return res.data.data;
};

export const postJurnalHarian = async (token, payload) => {
  const res = await api.post('/mobile/jurnal-harian', payload, { headers: headers(token) });
  return res.data;
};

export const putJurnalHarian = async (token, id, payload) => {
  const res = await api.put(`/mobile/jurnal-harian/${id}`, payload, { headers: headers(token) });
  return res.data;
};