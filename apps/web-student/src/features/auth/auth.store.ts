import { create } from "zustand";
import api from "../../lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
  setAuth: (token: string, user: User) => void;
  validateToken: (token: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        // Decode JWT to check expiry
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);

        // Check if token is expired (exp is in seconds)
        if (payload.exp && payload.exp < now) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
          return;
        }

        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, isInitialized: true });
      } catch (e) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }

      set({ token, user, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
        loading: false,
      });
      return false;
    }
  },

  register: async (fullName, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/register", {
        fullName,
        email,
        password,
      });
      const { token, user } = response.data.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }

      set({ token, user, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message ||
          "Đăng ký thất bại. Email có thể đã được sử dụng.",
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    set({ token: null, user: null, isAuthenticated: false });
  },

  validateToken: (token: string): boolean => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      return !payload.exp || payload.exp >= now;
    } catch {
      return false;
    }
  },

  setAuth: (token: string, user: User) => {
    if (!token || !user) return;
    // Validate token expiration
    if (!useAuthStore.getState().validateToken(token)) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    }
    set({ token, user, isAuthenticated: true });
  },
}));
