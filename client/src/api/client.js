import axios from "axios";
import { authStore } from "./authStore.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});
api.interceptors.request.use((config) => {
  const token = authStore.get()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response.data,
  (error) =>
    Promise.reject(
      new Error(
        error.response?.data?.error || error.message || "Something went wrong",
      ),
    ),
);

export default api;
