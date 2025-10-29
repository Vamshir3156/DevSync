
import axios from "axios";
import { useAuthStore } from "../store/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
