import api, { API_BASE_URL } from './client';
import { ENDPOINTS } from '../constants/endpoints';

console.log('API_BASE_URL =', API_BASE_URL);
console.log('LOGIN URL =', `${API_BASE_URL}/wali-app/login`);

export const authApi = {
  async login(nomor_hp, pin, tenant_slug) {
    const payload = {
      nomor_hp,
      pin,
      tenant_slug: tenant_slug || 'default',
    };
    console.log('LOGIN REQUEST payload', payload);
    console.log('LOGIN REQUEST url', `${API_BASE_URL}${ENDPOINTS.LOGIN}`);
    try {
      const res = await api.post(ENDPOINTS.LOGIN, payload);
      console.log('LOGIN RESPONSE status', res.status);
      return res.data;
    } catch (err) {
      console.log('AXIOS ERROR', err);
      console.log('MESSAGE', err.message);
      console.log('CODE', err.code);
      console.log('STATUS', err.response?.status);
      console.log('DATA', err.response?.data);
      throw err;
    }
  },

  async me() {
    const res = await api.get(ENDPOINTS.ME);
    return res.data;
  },
};
