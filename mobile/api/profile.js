import api, { setToken } from './api';

export const updateProfile = async (token, payload) => {
  try {
    setToken(token);
    const res = await api.put('/profile', payload);
    return res.data;
  } catch (err) {
    console.error('Error updateProfile:', err.response?.data || err.message);
    throw err;
  }
};