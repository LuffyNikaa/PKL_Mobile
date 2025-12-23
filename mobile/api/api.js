import axios from 'axios';

// Ganti dengan IP server Laravel kamu
const API_BASE_URL = 'http://192.168.1.6:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fungsi untuk set token otomatis
export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
