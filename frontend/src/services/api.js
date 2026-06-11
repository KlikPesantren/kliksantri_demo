import axios from "axios";
console.log("API_BASE_URL =", API_BASE_URL);
const api = axios.create({
  baseURL: "http://10.161.70.56:3000"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;