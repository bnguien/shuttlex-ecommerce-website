import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const BASE_URL = "http://127.0.0.1:8000";

export const authApi = axios.create({
  baseURL: BASE_URL,
});

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const expiry = decoded.exp;
        const now = Date.now() / 1000;

        if (expiry > now) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          localStorage.removeItem("access");
        }
      } catch {
        localStorage.removeItem("access");
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
