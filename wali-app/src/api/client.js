import axios from 'axios';
import { storage } from '../utils/storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

// Prioritas: nilai dari wali-app/.env (API_BASE_URL)
// Android emulator default: http://10.161.70.56:3000
// Device fisik: ganti di wali-app/.env → API_BASE_URL=http://<IP_KOMPUTER>:3000
const API_BASE_URL = ENV_API_BASE_URL || 'http://10.161.70.56:3000';

console.log('API BASE URL =', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: tambahkan token + X-Santri-Id ke setiap request
api.interceptors.request.use(
  async (config) => {
    console.log('REQUEST', config.method?.toUpperCase(), API_BASE_URL + config.url);

    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const santriId = await storage.getActiveSantriId();
    if (santriId) {
      config.headers['X-Santri-Id'] = String(santriId);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: tangani 401 dan error global
let _logoutCallback = null;

export function setLogoutCallback(fn) {
  _logoutCallback = fn;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;

    if (status === 401) {
      await storage.clearSession();
      if (_logoutCallback) {
        _logoutCallback();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
