import axios from 'axios';
import { storage } from '../utils/storage';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';
import {
  isTenantSuspendedResponse,
} from '../constants/tenant';

const DEV_API_FALLBACK = 'http://10.10.2.140:3000';

const API_BASE_URL = (ENV_API_BASE_URL || (__DEV__ ? DEV_API_FALLBACK : '')).replace(
  /\/$/,
  '',
);

if (!API_BASE_URL && !__DEV__) {
  console.error('API_BASE_URL is required. Set it in wali-app/.env before building APK.');
}

console.log('ENV URL =', ENV_API_BASE_URL);
console.log('API_BASE_URL =', API_BASE_URL);
console.log('LOGIN URL =', `${API_BASE_URL}/wali-app/login`);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
  (error) => Promise.reject(error),
);

let _logoutCallback = null;

export function setLogoutCallback(fn) {
  _logoutCallback = fn;
}

function logAxiosError(error, context = 'response') {
  console.log('AXIOS ERROR', error);
  console.log('MESSAGE', error?.message);
  console.log('CODE', error?.code);
  console.log('STATUS', error?.response?.status);
  console.log('DATA', error?.response?.data);
  if (context) {
    console.log('AXIOS CONTEXT', context);
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    logAxiosError(error, error.config?.url);
    const status = error.response?.status;

    if (status === 401 || isTenantSuspendedResponse(status, error.response?.data)) {
      await storage.clearSession();
      if (_logoutCallback) {
        _logoutCallback();
      }
    }

    return Promise.reject(error);
  },
);

export { API_BASE_URL };
export default api;
