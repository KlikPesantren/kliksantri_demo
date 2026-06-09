import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const nilaiApi = {
  async getNilai({ bulan, tahun } = {}) {
    const res = await api.get(ENDPOINTS.NILAI, {
      params: { bulan, tahun },
    });
    return res.data;
  },
};
