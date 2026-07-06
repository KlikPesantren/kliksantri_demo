import api from './client';
import { ENDPOINTS } from '../constants/endpoints';

export const featuresApi = {
  async getFeatures() {
    const res = await api.get(ENDPOINTS.FEATURES);
    return res.data;
  },
};
