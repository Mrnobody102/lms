import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const tenantId =
    typeof window !== "undefined"
      ? localStorage.getItem("tenantId") || "trung-tam-demo"
      : "trung-tam-demo";
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
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        // Optional: redirect to login
      }
    }
    return Promise.reject(error);
  },
);

export default api;
