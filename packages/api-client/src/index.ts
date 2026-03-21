import axios, { InternalAxiosRequestConfig, AxiosInstance, AxiosResponse } from "axios";

const TIMEOUT_MS = 15000;

export interface ApiClientConfig {
  tenantId?: string;
  baseURL?: string;
  onUnauthorized?: () => void;
}

function detectLocale(): string {
  if (typeof window === "undefined") return "vi";
  const match = window.location.pathname.match(/^\/(en|vi)\//);
  return match?.[1] || "vi";
}

export function createApiClient(config: ApiClientConfig = {}): AxiosInstance {
  const { tenantId, onUnauthorized } = config;

  const api = axios.create({
    baseURL:
      process.env.NEXT_PUBLIC_API_URL
        ? `${process.env.NEXT_PUBLIC_API_URL}/api`
        : "http://localhost:4000/api",
    timeout: TIMEOUT_MS,
    withCredentials: true,
  });

  api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const resolvedTenantId =
      typeof window !== "undefined"
        ? localStorage.getItem("tenantId") || tenantId
        : tenantId;

    if (resolvedTenantId) {
      config.headers["x-tenant-id"] = resolvedTenantId;
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  // Auto-unwrap NestJS ResponseInterceptor: { success: true, data } → data
  // Paginated responses skip wrapping (have "meta" key), so they pass through as-is.
  // Both single and wrapped responses end up as { data: T, meta?: {...} } or { data: T }.
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      const data = response.data as Record<string, unknown>;
      if (data && data.success === true && "data" in data) {
        response.data = data.data;
      }
      return response;
    },
    (error: unknown) => {
      const axiosError = error as { code?: string; message?: string; response?: { status?: number } };

      if (axiosError.code === "ECONNABORTED" || axiosError.message?.includes("timeout")) {
        axiosError.message = "Request timed out. Please try again.";
      }

      if (axiosError.response?.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (onUnauthorized) {
          onUnauthorized();
        } else {
          const locale = detectLocale();
          const returnUrl = window.location.pathname;
          window.location.href = `/${locale}/login${returnUrl !== `/${locale}/login` ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export const defaultApiClient = createApiClient();
