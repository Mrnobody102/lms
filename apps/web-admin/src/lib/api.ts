import axios from "axios";

const TIMEOUT_MS = 15000; // 15 second request timeout

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : (console.warn("[DEV] Using localhost fallback for API URL"),
      "http://localhost:4000/api"),
  timeout: TIMEOUT_MS,
  withCredentials: true,
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
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
  (response) => response,
  (error: any) => {
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      error.message = "Request timed out. Please try again.";
    }
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear auth state
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login
        window.location.href = "/vi/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
