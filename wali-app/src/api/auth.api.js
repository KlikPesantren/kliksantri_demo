import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const authApi = {
  async login(nomor_hp, pin, tenant_slug) {
    const payload = {
      nomor_hp,
      pin,
      tenant_slug: tenant_slug || 'default',
    };
    const res = await api.post(ENDPOINTS.LOGIN, payload);
    return res.data;
  },

  async me() {
    const res = await api.get(ENDPOINTS.ME);
    return res.data;
  },
};
