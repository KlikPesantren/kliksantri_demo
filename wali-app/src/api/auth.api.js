import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const authApi = {
  async login(nomor_hp, pin) {
    const res = await api.post(ENDPOINTS.LOGIN, { nomor_hp, pin });
    return res.data;
  },

  async me() {
    const res = await api.get(ENDPOINTS.ME);
    return res.data;
  },
};
