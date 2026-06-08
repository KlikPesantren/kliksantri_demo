import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const santriApi = {
  async getAnak() {
    const res = await api.get(ENDPOINTS.ANAK);
    return res.data;
  },

  async getDashboard() {
    const res = await api.get(ENDPOINTS.DASHBOARD);
    return res.data;
  },

  async getProfil() {
    const res = await api.get(ENDPOINTS.SANTRI_PROFIL);
    return res.data;
  },
};
