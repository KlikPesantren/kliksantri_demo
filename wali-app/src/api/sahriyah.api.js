import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const sahriyahApi = {
  async getList({ bulan, tahun } = {}) {
    const res = await api.get(ENDPOINTS.SAHRIYAH, {
      params: {
        ...(bulan ? { bulan } : {}),
        ...(tahun ? { tahun } : {}),
      },
    });
    return res.data;
  },

  async getRiwayat(tagihanId) {
    const res = await api.get(ENDPOINTS.SAHRIYAH_RIWAYAT(tagihanId));
    return res.data;
  },
};
