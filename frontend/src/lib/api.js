import { useAuthStore } from "@/store/useAuthStore";
import axios from "axios";

// Helper function to read cookies safely without crashing
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
});

apiClient.interceptors.request.use((config) => {
  // Only run this in the browser
  if (typeof window !== "undefined") {
    // 1. Auth Token (LocalStorage)
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 2. Set JSON content-type only if not FormData
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    // 3. Language Header (Cookie)
    // We get the locale from 'NEXT_LOCALE' and ensure it's a clean string like 'en' or 'bn'
    try {
      const rawLocale = getCookie("NEXT_LOCALE") || "en";
      const cleanLocale = rawLocale.split('-')[0]; // Turns 'en-US' into 'en'
      
      config.headers["Accept-Language"] = cleanLocale;
    } catch (e) {
      console.error("Cookie lookup failed, defaulting to 'en'", e);
      config.headers["Accept-Language"] = "en";
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

apiClient.interceptors.response.use(
  (response) => response, 
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh/redirect logic for auth endpoints (login, register, etc.)
    // A 401 there means wrong credentials — let the page handle the error.
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");
    if (isAuthEndpoint) return Promise.reject(error);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh");

      if (refreshToken) {
        try {
          const res = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccessToken = res.data.access;
          localStorage.setItem("access", newAccessToken);
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") window.location.href = "/";
          return Promise.reject(refreshError);
        }
      }

      // No refresh token — session is gone, force logout
      useAuthStore.getState().logout();
      if (typeof window !== "undefined") window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default apiClient;