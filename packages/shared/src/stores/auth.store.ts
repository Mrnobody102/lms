import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
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
  register?: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
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

function extractErrorMsg(err: unknown, fallback: string): string {
  const axiosErr = err as {
    response?: { data?: { message?: string | string[]; success?: boolean } };
  };
  const data = axiosErr.response?.data;
  const msg = data?.message;
  if (!msg && data?.success === false) return fallback;
  return Array.isArray(msg) ? msg[0] : (msg ?? fallback);
}

export function createAuthStore(options: CreateAuthStoreOptions) {
  const { api, persistUser = true, checkAuthTimeoutMs = 4000, messages = {} } = options;

  const {
    loginError = 'Login failed. Please check your credentials.',
    registerError = 'Registration failed. Please try again.',
  } = messages;

  const clearStoredAuth = () => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
  };

  const persistAuthUser = (user: AuthUser | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('tenantId');

    if (persistUser && user) {
      localStorage.setItem('user', JSON.stringify(user));
      return;
    }

    localStorage.removeItem('user');
  };

  return create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,
    isInitialized: false,
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

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
      } catch {
        clearStoredAuth();
        set({
          user: null,
          isAuthenticated: false,
          isInitialized: true,
          error: null,
        });
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post<{ user: AuthUser }>('/auth/login', {
          email,
          password,
        });
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

      clearStoredAuth();
      set({ user: null, isAuthenticated: false, isInitialized: true, error: null });
    },

    register: async (fullName, email, password) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post<{ user: AuthUser }>('/auth/register', {
          fullName,
          email,
          password,
        });
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
        set({ error: extractErrorMsg(err, registerError), loading: false });
        return false;
      }
    },
  }));
}
