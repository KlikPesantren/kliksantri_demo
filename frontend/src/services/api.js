import axios from "axios";

const DEV_API_FALLBACK = "http://localhost:3000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? DEV_API_FALLBACK : "")
).replace(/\/$/, "");

if (!API_BASE_URL) {
  console.error(
    "VITE_API_BASE_URL is required for production builds. Set it in frontend/.env",
  );
}

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
