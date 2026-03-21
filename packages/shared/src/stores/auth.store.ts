import { create } from "zustand";
import type { AxiosStatic } from "axios";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  tenantId: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register?: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  validateToken: (token: string) => boolean;
}

export interface CreateAuthStoreOptions {
  api: Pick<AxiosStatic, "post">;
  /** Store user object in localStorage. Default: true */
  persistUser?: boolean;
  /** Custom error messages */
  messages?: {
    loginError?: string;
    registerError?: string;
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return null;
    return JSON.parse(atob(base64.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export function validateToken(token: string | null): boolean {
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const now = Math.floor(Date.now() / 1000);
  return !payload.exp || (payload.exp as number) >= now;
}

export function createAuthStore(options: CreateAuthStoreOptions) {
  const { api, persistUser = true, messages = {} } = options;

  const {
    loginError = "Login failed. Please check your credentials.",
    registerError = "Registration failed. Please try again.",
  } = messages;

  return create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isInitialized: false,
    loading: false,
    error: null,

    clearError: () => set({ error: null }),

    validateToken,

    checkAuth: () => {
      if (typeof window === "undefined") {
        set({ isInitialized: true });
        return;
      }

      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && validateToken(token)) {
        const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
        set({ token, user, isAuthenticated: true, isInitialized: true });
      } else if (token || userStr) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
      } else {
        set({ isInitialized: true });
      }
    },

    login: async (email, password) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post<{ token: string; user: AuthUser }>("/auth/login", { email, password });
        const { token, user } = response.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          if (persistUser && user) {
            localStorage.setItem("user", JSON.stringify(user));
            if (user.tenantId) {
              localStorage.setItem("tenantId", user.tenantId);
            }
          }
        }

        set({ token, user: persistUser ? user : null, isAuthenticated: true, loading: false });
        return true;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string | string[] } } };
        const msg = error.response?.data?.message;
        set({
          error: Array.isArray(msg) ? msg[0] : (msg ?? loginError),
          loading: false,
        });
        return false;
      }
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("tenantId");
      }
      set({ token: null, user: null, isAuthenticated: false });
    },

    register: async (fullName: string, email: string, password: string) => {
      set({ loading: true, error: null });
      try {
        const response = await api.post<{ token: string; user: { tenantId?: string } }>("/auth/register", { fullName, email, password });
        const { token, user } = response.data;

        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          if (persistUser) {
            localStorage.setItem("user", JSON.stringify({}));
            if (user.tenantId) {
              localStorage.setItem("tenantId", user.tenantId);
            }
          }
        }

        set({ token, user: null, isAuthenticated: true, loading: false });
        return true;
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string | string[] } } };
        const msg = error.response?.data?.message;
        set({
          error: Array.isArray(msg) ? msg[0] : (msg ?? registerError),
          loading: false,
        });
        return false;
      }
    },

    setAuth: (token: string, user: AuthUser) => {
      if (!token || !user) return;
      if (!validateToken(token)) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
        return;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        if (persistUser) {
          localStorage.setItem("user", JSON.stringify(user));
          if (user.tenantId) {
            localStorage.setItem("tenantId", user.tenantId);
          }
        }
      }
      set({ token, user: persistUser ? user : null, isAuthenticated: true });
    },
  }));
}
