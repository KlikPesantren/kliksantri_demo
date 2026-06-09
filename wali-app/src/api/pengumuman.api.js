import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const pengumumanApi = {
  async getList({ limit = 20, offset = 0 } = {}) {
    const res = await api.get(ENDPOINTS.PENGUMUMAN, {
      params: { limit, offset },
    });
    return res.data;
  },
};
