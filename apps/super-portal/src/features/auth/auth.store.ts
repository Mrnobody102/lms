import { create } from "zustand";
import api from "@/lib/api";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,

  checkAuth: () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      set({ token, isAuthenticated: true, isInitialized: true });
    } else {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      console.log("Login attempt:", { email, password });
      const response = await api.post("/auth/login", { email, password });
      console.log("Login response:", response.data);
      const { token } = response.data.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
      }

      set({ token, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      console.error("Login error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      set({
        error: error.response?.data?.message || "Login failed",
        loading: false,
      });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    set({ token: null, isAuthenticated: false });
  },
}));
