import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const profilPesantrenApi = {
  async get() {
    const res = await api.get(ENDPOINTS.PROFIL_PESANTREN);
    return res.data;
  },
};
