import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";

const TIMEOUT_MS = 15000; // 15 second request timeout

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : (console.warn("[DEV] Using localhost fallback for API URL"),
      "http://localhost:4000/api"),
  headers: {
    "Content-Type": "application/json",
  },
  timeout: TIMEOUT_MS,
  withCredentials: true,
});

// Interceptor to add Tenant ID and Auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Get tenant ID from localStorage
  const tenantId =
    typeof window !== "undefined"
      ? localStorage.getItem("tenantId")
      : null;

  if (tenantId) {
    config.headers["x-tenant-id"] = tenantId;
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.message = "Request timed out. Please try again.";
    }
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login with return URL
        const returnUrl = window.location.pathname;
        window.location.href = `/vi/login${returnUrl !== "/vi/login" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;
      }
    }
    return Promise.reject(error);
  },
);

export default api;
