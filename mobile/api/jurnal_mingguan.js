import api from './api';

const headers = (token) => ({ Authorization: `Bearer ${token}` });

export const getJurnalMingguan = async (token, search = '') => {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await api.get(`/mobile/jurnal-mingguan${params}`, { headers: headers(token) });
  return res.data.data;
};

export const postJurnalMingguan = async (token, payload) => {
  const form = new FormData();
  form.append('kegiatan_jurnal_mingguan', payload.kegiatan);
  if (payload.dokumentasi) {
    form.append('dokumentasi_jurnal_mingguan', {
      uri: payload.dokumentasi.uri,
      name: payload.dokumentasi.name ?? `dok_${Date.now()}.jpg`,
      type: payload.dokumentasi.type ?? 'image/jpeg',
    });
  }
  const res = await api.post('/mobile/jurnal-mingguan', form, {
    headers: { ...headers(token), 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const putJurnalMingguan = async (token, id, payload) => {
  const form = new FormData();
  form.append('kegiatan_jurnal_mingguan', payload.kegiatan);
  // ✅ Hanya append dokumentasi jika ada (tidak mengirim field kosong)
  if (payload.dokumentasi) {
    form.append('dokumentasi_jurnal_mingguan', {
      uri: payload.dokumentasi.uri,
      name: payload.dokumentasi.name ?? `dok_${Date.now()}.jpg`,
      type: payload.dokumentasi.type ?? 'image/jpeg',
    });
  }
  // ✅ Jika tidak ada dokumentasi, jangan kirim field apapun
  const res = await api.post(`/mobile/jurnal-mingguan/${id}?_method=PUT`, form, {
    headers: { ...headers(token), 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};