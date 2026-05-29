import { create } from 'zustand';
import { AUTH_UNAUTHORIZED_EVENT, LEGACY_AUTH_STORAGE_KEYS } from '../constants/auth';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  role: string;
  tenantId: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (credential: string, portal?: 'student' | 'admin' | 'super') => Promise<boolean>;
  register?: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setUser: (user: AuthUser | null) => void;
  setTenantId: (tenantId: string | null) => void;
  setMessages: (messages: { loginError?: string; registerError?: string }) => void;
}

export interface CreateAuthStoreOptions {
  api: AuthApiClient;
  persistUser?: boolean;
  checkAuthTimeoutMs?: number;
  messages?: {
    loginError?: string;
    registerError?: string;
  };
}

interface AuthRequestConfig {
  skipUnauthorizedRedirect?: boolean;
  timeout?: number;
}

interface AuthApiResponse<T> {
  data: T;
}

interface AuthApiClient {
  get<T>(url: string, config?: AuthRequestConfig): Promise<AuthApiResponse<T>>;
  post<T>(url: string, data?: unknown, config?: AuthRequestConfig): Promise<AuthApiResponse<T>>;
}

function getHttpStatus(err: unknown): number | undefined {
  const axiosErr = err as {
    response?: { status?: number };
  };

  return axiosErr.response?.status;
}

// Internal error patterns that should NOT be shown verbatim to end users
const INTERNAL_ERROR_PATTERNS = [
  /tenant context/i,
  /invalid or inactive tenant/i,
  /tenant mismatch/i,
  /token.*revoked/i,
  /token.*version/i,
  /internal server error/i,
];

function sanitizeServerMessage(msg: string, fallback: string): string {
  if (INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(msg))) {
    return fallback;
  }
  return msg;
}

function extractErrorMsg(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: { status?: number; data?: { message?: string | string[]; success?: boolean } };
  };
  const data = axiosErr.response?.data;
  const msg = data?.message;
  if (!msg && data?.success === false) return fallback;
  const rawMsg = Array.isArray(msg) ? msg[0] : (msg ?? fallback);
  // 5xx errors should always use the generic fallback
  const status = axiosErr.response?.status;
  if (status && status >= 500) return fallback;
  return sanitizeServerMessage(rawMsg, fallback);
}

export function createAuthStore(options: CreateAuthStoreOptions) {
  const { api, persistUser = true, checkAuthTimeoutMs = 4000, messages = {} } = options;

  let {
    loginError = 'Login failed. Please check your credentials.',
    registerError = 'Registration failed. Please try again.',
  } = messages;

  const clearStoredAuth = () => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.user);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.tenantId);
  };

  const persistAuthUser = (user: AuthUser | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.token);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.tenantId);

    if (persistUser && user) {
      localStorage.setItem(LEGACY_AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      return;
    }

    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.user);
  };

  return create<AuthState>((set) => {
    const resetAuthState = () => {
      clearStoredAuth();
      set({
        user: null,
        isAuthenticated: false,
        isInitialized: true,
        loading: false,
        error: null,
      });
    };

    const markAuthCheckFailed = () => {
      set((state) => ({
        ...state,
        isInitialized: true,
        loading: false,
        error: null,
      }));
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener(AUTH_UNAUTHORIZED_EVENT, resetAuthState);
    }

    return {
      user: null,
      isAuthenticated: false,
      isInitialized: false,
      loading: false,
      error: null,

      clearError: () => set({ error: null }),

      setMessages: (newMessages: { loginError?: string; registerError?: string }) => {
        if (newMessages.loginError) loginError = newMessages.loginError;
        if (newMessages.registerError) registerError = newMessages.registerError;
      },

      setUser: (user: AuthUser | null) => {
        persistAuthUser(user);
        set({ user, isAuthenticated: !!user });
      },

      setTenantId: (tenantId: string | null) => {
        if (typeof window !== 'undefined') {
          if (tenantId) {
            localStorage.setItem(LEGACY_AUTH_STORAGE_KEYS.tenantId, tenantId);
          } else {
            localStorage.removeItem(LEGACY_AUTH_STORAGE_KEYS.tenantId);
          }
        }
      },

      checkAuth: async () => {
        if (typeof window === 'undefined') {
          set({ isInitialized: true });
          return;
        }

        try {
          const response = await api.get<AuthUser>('/users/me', {
            skipUnauthorizedRedirect: true,
            timeout: checkAuthTimeoutMs,
          });
          const user = response.data;

          persistAuthUser(user);
          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            error: null,
          });
        } catch (err) {
          if (getHttpStatus(err) === 401) {
            resetAuthState();
            return;
          }

          markAuthCheckFailed();
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ user: AuthUser }>(
            '/auth/login',
            {
              email,
              password,
            },
            {
              skipUnauthorizedRedirect: true,
            },
          );
          const { user } = response.data;

          persistAuthUser(user);

          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            loading: false,
          });
          return true;
        } catch (err) {
          set({ error: extractErrorMsg(err, loginError), loading: false });
          return false;
        }
      },

      loginWithGoogle: async (credential, portal = 'student') => {
        set({ loading: true, error: null });
        try {
          const response = await api.post<{ user: AuthUser }>(
            '/auth/google',
            {
              credential,
              portal,
            },
            {
              skipUnauthorizedRedirect: true,
            },
          );
          const { user } = response.data;

          persistAuthUser(user);

          set({
            user,
            isAuthenticated: true,
            isInitialized: true,
            loading: false,
          });
          return true;
        } catch (err) {
          set({ error: extractErrorMsg(err, loginError), loading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout', null, {
            skipUnauthorizedRedirect: true,
          });
        } catch {
          // Local state still needs to be cleared if the logout request fails.
        }

        resetAuthState();
      },

      register: async (fullName, email, password) => {
        set({ loading: true, error: null });
        try {
          await api.post<{ user: AuthUser }>(
            '/auth/register',
            {
              fullName,
              email,
              password,
            },
            {
              skipUnauthorizedRedirect: true,
            },
          );
          set({
            user: null,
            isAuthenticated: false,
            isInitialized: true,
            loading: false,
          });
          return true;
        } catch (err) {
          set({ error: extractErrorMsg(err, registerError), loading: false });
          return false;
        }
      },
    };
  });
}
