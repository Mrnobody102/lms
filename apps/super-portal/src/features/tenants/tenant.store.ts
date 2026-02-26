import { create } from "zustand";
import api from "@/lib/api";
import { generateMockTenants } from "./tenant.mock";

// Đổi thành true nếu muốn hiển thị mock data để test UI (phân trang, tìm kiếm)
const USE_MOCK_DATA = false;

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

interface TenantState {
  tenants: Tenant[];
  loading: boolean;
  error: string | null;
  fetchTenants: () => Promise<void>;
  createTenant: (data: any) => Promise<boolean>;
  updateTenant: (id: string, data: any) => Promise<boolean>;
  deleteTenant: (id: string) => Promise<boolean>;
  restoreTenant: (id: string) => Promise<boolean>;
  currentTenant: Tenant | null;
  fetchTenantById: (id: string) => Promise<void>;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  currentTenant: null,
  loading: false,
  error: null,

  fetchTenants: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get("/admin/tenants");

      let finalData = response.data.data || [];

      if (USE_MOCK_DATA) {
        finalData = [...finalData, ...generateMockTenants(45)];
      }

      set({ tenants: finalData, loading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to fetch tenants",
        loading: false,
      });
    }
  },

  fetchTenantById: async (id) => {
    set({ loading: true, error: null, currentTenant: null });
    try {
      const response = await api.get(`/admin/tenants/${id}`);
      set({ currentTenant: response.data.data, loading: false });
    } catch (error: any) {
      set({
        error:
          error.response?.data?.message || "Failed to fetch tenant details",
        loading: false,
      });
    }
  },

  createTenant: async (data) => {
    set({ loading: true, error: null });
    try {
      await api.post("/admin/tenants", data);
      set((state) => ({ loading: false }));
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to create tenant",
        loading: false,
      });
      return false;
    }
  },

  updateTenant: async (id, data) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/admin/tenants/${id}`, data);
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to update tenant",
        loading: false,
      });
      return false;
    }
  },

  deleteTenant: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/admin/tenants/${id}`);
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to delete tenant",
        loading: false,
      });
      return false;
    }
  },

  restoreTenant: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.patch(`/admin/tenants/${id}/restore`);
      set({ loading: false });
      return true;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Failed to restore tenant",
        loading: false,
      });
      return false;
    }
  },
}));
