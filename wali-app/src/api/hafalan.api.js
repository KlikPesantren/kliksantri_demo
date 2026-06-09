import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const hafalanApi = {
  async getHafalan({ bulan, tahun } = {}) {
    const res = await api.get(ENDPOINTS.HAFALAN, {
      params: { bulan, tahun },
    });
    return res.data;
  },
};
