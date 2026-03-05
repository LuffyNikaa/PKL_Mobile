import api from './api';

// Cek status absensi hari ini: 'belum' | 'sudah_masuk' | 'sudah_pulang'
export const getStatusAbsensi = async (token) => {
  const response = await api.get('/mobile/absensi/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.status;
};

// Absen masuk (validasi radius di frontend & backend)
export const postAbsensi = async (token, payload) => {
  const response = await api.post('/mobile/absensi', {
    latitude_absensi:  payload.latitude,
    longitude_absensi: payload.longitude,
    status_absensi:    payload.status,
    alasan_absensi:    payload.alasan ?? null,
  }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Absen pulang (tidak perlu lokasi)
export const postAbsensiPulang = async (token) => {
  const response = await api.post('/mobile/absensi/pulang', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};