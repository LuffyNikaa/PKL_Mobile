import api from './api';

export const getStatusAbsensi = async (token) => {
  const response = await api.get('/mobile/absensi/status', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.status;
};

// Absen masuk — pakai FormData karena ada file upload
export const postAbsensi = async (token, payload) => {
  const form = new FormData();
  form.append('latitude_absensi',  String(payload.latitude));
  form.append('longitude_absensi', String(payload.longitude));
  form.append('status_absensi',    payload.status);

  if (payload.alasan) {
    form.append('alasan_absensi', payload.alasan);
  }
  if (payload.foto) {
    form.append('foto_surat', {
      uri:  payload.foto.uri,
      name: payload.foto.name ?? 'surat.jpg',
      type: payload.foto.type ?? 'image/jpeg',
    });
  }

  const response = await api.post('/mobile/absensi', form, {
    headers: {
      Authorization:  `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Absen pulang — tidak perlu lokasi atau file
export const postAbsensiPulang = async (token) => {
  const response = await api.post('/mobile/absensi/pulang', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};