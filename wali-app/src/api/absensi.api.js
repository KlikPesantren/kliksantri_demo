import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const absensiApi = {
  async getAbsensi({ bulan, tahun } = {}) {
    const res = await api.get(ENDPOINTS.ABSENSI, {
      params: { bulan, tahun },
    });
    return res.data;
  },
};
