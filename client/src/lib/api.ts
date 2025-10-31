import axios from "axios";
import { useAuthStore } from "../store/auth";

const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_BASE = RAW_API.replace(/\/$/, "");

export const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const noResponse = !error?.response;
    const transient =
      noResponse || status === 502 || status === 503 || status === 504;

    if (transient) {
      try {
        window.dispatchEvent(new Event("server-offline"));
      } catch {}
    }

    return Promise.reject(error);
  }
);
