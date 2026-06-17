import axios from "axios";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const authAPI = {
  register: (data: any) => api.post("/api/auth/register", data),
  login: (data: any) => api.post("/api/auth/login", data),
  me: () => api.get("/api/users/me"),
};

// Interviews
export const interviewAPI = {
  create: (data: any) => api.post("/api/interviews/", data),
  list: () => api.get("/api/interviews/"),
  get: (id: number) => api.get(`/api/interviews/${id}`),
  start: (id: number, data: any) => api.post(`/api/interviews/${id}/start`),
  submitAnswer: (id: number, data: any) =>
    api.post(`/api/interviews/${id}/answers`, data),
  complete: (id: number) => api.post(`/api/interviews/${id}/complete`),
};

// Resume
export const resumeAPI = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/resume/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  list: () => api.get("/api/resume/"),
  get: (id: number) => api.get(`/api/resume/${id}`),
};

// Analytics
export const analyticsAPI = {
  summary: () => api.get("/api/analytics/summary"),
};

export default api;
