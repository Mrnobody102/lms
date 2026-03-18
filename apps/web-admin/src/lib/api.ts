import axios, { InternalAxiosRequestConfig, AxiosResponse } from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add Tenant ID and Auth token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Get tenant ID from localStorage or from the context/subdomain
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
  (response: AxiosResponse) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized (redirect to login)
      console.error("Unauthorized access");
    }
    return Promise.reject(error);
  },
);

export default api;
