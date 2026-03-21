import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export function useTenants(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const response = await api.get<Tenant[]>("/admin/tenants");
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: async () => {
      const response = await api.get<Tenant>(`/admin/tenants/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const response = await api.post<Tenant>("/admin/tenants", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      const response = await api.put<Tenant>(`/admin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant", vars.id] });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}

export function useRestoreTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/admin/tenants/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
