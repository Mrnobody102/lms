import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const TIMEOUT_MS = 15000;
const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
  }
}

export interface ApiClientConfig {
  tenantId?: string | (() => string | undefined);
  baseURL?: string;
  onUnauthorized?: () => void;
  sendTenantHeaderInProduction?: boolean;
}

function detectLocale(): string {
  if (typeof window === 'undefined') return 'vi';
  const match = window.location.pathname.match(/^\/(en|vi)(?:\/|$)/);
  return match?.[1] || 'vi';
}

function getDefaultBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return `${process.env.NEXT_PUBLIC_API_URL}/api`;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL is required in production');
  }

  return 'http://localhost:4000/api';
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;

  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
}

function isLocalBrowserHost(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function resolveTenantHint(tenantId: ApiClientConfig['tenantId']): string | undefined {
  const value = typeof tenantId === 'function' ? tenantId() : tenantId;
  return value?.trim() || undefined;
}

export function createApiClient(config: ApiClientConfig = {}): AxiosInstance {
  const { tenantId, onUnauthorized, sendTenantHeaderInProduction = false } = config;

  const api = axios.create({
    baseURL: config.baseURL ?? getDefaultBaseUrl(),
    timeout: TIMEOUT_MS,
    withCredentials: true,
  });

  api.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
    const tenantHint = resolveTenantHint(tenantId);
    if (tenantHint && (sendTenantHeaderInProduction || isLocalBrowserHost())) {
      requestConfig.headers['x-tenant-id'] = tenantHint;
    }

    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      requestConfig.headers[CSRF_HEADER_NAME] = decodeURIComponent(csrfToken);
    }

    return requestConfig;
  });

  api.interceptors.response.use(
    (response: AxiosResponse) => {
      const data = response.data as Record<string, unknown>;
      if (data && data.success === true && 'data' in data) {
        response.data = data.data;
      }
      return response;
    },
    (error: unknown) => {
      const axiosError = error as {
        code?: string;
        config?: InternalAxiosRequestConfig;
        message?: string;
        response?: { status?: number };
      };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        axiosError.message = 'Request timed out. Please try again.';
      }

      if (axiosError.response?.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        if (axiosError.config?.skipUnauthorizedRedirect === true) {
          return Promise.reject(error);
        }

        if (onUnauthorized) {
          onUnauthorized();
        } else {
          const locale = detectLocale();
          const returnUrl = window.location.pathname;
          window.location.href = `/${locale}/login${returnUrl !== `/${locale}/login` ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`;
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export const defaultApiClient = createApiClient();
