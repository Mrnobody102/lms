import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import {
  AUTH_UNAUTHORIZED_EVENT,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  LEGACY_AUTH_STORAGE_KEYS,
  TENANT_ID_HEADER,
} from '@repo/shared';

const TIMEOUT_MS = 60000;

declare module 'axios' {
  interface AxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
    _retry?: boolean;
  }

  interface InternalAxiosRequestConfig {
    skipUnauthorizedRedirect?: boolean;
    _retry?: boolean;
  }
}

export interface ApiClientConfig {
  tenantId?: string | (() => string | undefined);
  baseURL?: string;
  onUnauthorized?: () => void;
  sendTenantHeaderInProduction?: boolean;
  supportedLocales?: readonly string[];
  defaultLocale?: string;
}

function detectLocale(
  supportedLocales: readonly string[] = ['vi', 'en'],
  defaultLocale = 'vi',
): string {
  if (typeof window === 'undefined') return defaultLocale;
  const locale = window.location.pathname.split('/')[1];
  return supportedLocales.includes(locale) ? locale : defaultLocale;
}

function appendApiPath(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/api`;
}

function getDefaultBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return appendApiPath(process.env.NEXT_PUBLIC_API_URL);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_API_URL is required in production');
  }

  return 'http://127.0.0.1:4000/api';
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

function shouldSendTenantHeader(sendTenantHeaderInProduction: boolean): boolean {
  return (
    process.env.NODE_ENV !== 'production' || sendTenantHeaderInProduction || isLocalBrowserHost()
  );
}

function resolveTenantHint(tenantId: ApiClientConfig['tenantId']): string | undefined {
  const value = typeof tenantId === 'function' ? tenantId() : tenantId;
  return value?.trim() || undefined;
}

function clearLegacyAuthState(): void {
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.token);
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.user);
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.tenantId);
}

function dispatchUnauthorizedEvent(): void {
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

function getReturnUrl(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function buildLoginRedirectUrl(locale: string, returnUrl: string): string {
  const loginPath = `/${locale}/login`;
  if (window.location.pathname === loginPath) {
    return loginPath;
  }

  return `${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`;
}

export function createApiClient(config: ApiClientConfig = {}): AxiosInstance {
  const {
    tenantId,
    onUnauthorized,
    sendTenantHeaderInProduction = false,
    supportedLocales,
    defaultLocale,
  } = config;

  const api = axios.create({
    baseURL: config.baseURL ?? getDefaultBaseUrl(),
    timeout: TIMEOUT_MS,
    withCredentials: true,
  });

  let isRefreshing = false;
  let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  const processQueue = (error: unknown) => {
    failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(undefined);
      }
    });
    failedQueue = [];
  };

  api.interceptors.request.use((requestConfig: InternalAxiosRequestConfig) => {
    const tenantHint = resolveTenantHint(tenantId);
    if (tenantHint && shouldSendTenantHeader(sendTenantHeaderInProduction)) {
      requestConfig.headers[TENANT_ID_HEADER] = tenantHint;
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
    async (error: unknown) => {
      const axiosError = error as {
        code?: string;
        config?: InternalAxiosRequestConfig;
        message?: string;
        response?: { status?: number };
      };

      if (axiosError.code === 'ECONNABORTED' || axiosError.message?.includes('timeout')) {
        axiosError.message = 'Request timed out. Please try again.';
      }

      const originalRequest = axiosError.config;

      if (
        axiosError.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login') &&
        typeof window !== 'undefined'
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => api(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await api.post('/auth/refresh', null, {
            skipUnauthorizedRedirect: axiosError.config?.skipUnauthorizedRedirect,
          });
          processQueue(null);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);

          if (axiosError.config?.skipUnauthorizedRedirect === true) {
            return Promise.reject(error);
          }

          clearLegacyAuthState();
          dispatchUnauthorizedEvent();

          if (onUnauthorized) {
            onUnauthorized();
          } else {
            const locale = detectLocale(supportedLocales, defaultLocale);
            const redirectUrl = buildLoginRedirectUrl(locale, getReturnUrl());
            const currentPath = window.location.pathname.replace(/\/$/, '');
            if (currentPath !== `/${locale}/login`) {
              window.location.assign(redirectUrl);
            }
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (axiosError.response?.status === 401 && typeof window !== 'undefined') {
        if (axiosError.config?.skipUnauthorizedRedirect === true) {
          return Promise.reject(error);
        }

        clearLegacyAuthState();
        dispatchUnauthorizedEvent();

        if (onUnauthorized) {
          onUnauthorized();
        } else {
          const locale = detectLocale(supportedLocales, defaultLocale);
          const redirectUrl = buildLoginRedirectUrl(locale, getReturnUrl());
          const currentPath = window.location.pathname.replace(/\/$/, '');
          if (currentPath !== `/${locale}/login`) {
            window.location.assign(redirectUrl);
          }
        }
      }

      return Promise.reject(error);
    },
  );

  return api;
}

export const defaultApiClient = createApiClient();
