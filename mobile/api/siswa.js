import api from './api';

const normalizeDudi = (dudi) => {
  if (!dudi) return null;
  if (typeof dudi === 'string') return dudi;
  return dudi.nama_dudi ?? dudi.nama ?? dudi.tempat_pkl ?? null;
};

export const getProfileSiswa = async (token) => {
  try {
    const response = await api.get('/mobile/siswa/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const raw = response.data?.data ?? response.data;
    const payload = raw?.siswa ?? raw ?? {};
    const dudiValue = payload.dudi ?? payload.tempat_pkl ?? payload.nama_dudi ?? null;

    return {
      ...payload,
      nama: payload.nama ?? payload.nama_siswa ?? payload.nama_lengkap ?? null,
      email: payload.email ?? payload.email_siswa ?? null,
      nis: payload.nis ?? payload.nis_siswa ?? null,
      jurusan: payload.jurusan ?? payload.jurusan_siswa ?? null,
      kelas: payload.kelas ?? payload.kelas_siswa ?? null,
      dudi: normalizeDudi(dudiValue),
      alamat: payload.alamat ?? payload.alamat_siswa ?? null,
      no_hp: payload.no_hp ?? payload.hp ?? payload.nomor_hp ?? null,
    };
  } catch (error) {
    console.log(error.response?.data || error.message);
    throw error;
  }
};
