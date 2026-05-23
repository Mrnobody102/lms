import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  settings: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

export interface TenantMutationPayload {
  name: string;
  slug: string;
  domain?: string;
  settings?: Record<string, unknown>;
}

export interface TenantUpdatePayload {
  name?: string;
  slug?: string;
  domain?: string | null;
  settings?: Record<string, unknown>;
  isActive?: boolean;
}

export function useTenants(options?: { enabled?: boolean; includeInactive?: boolean }) {
  return useQuery({
    queryKey: ['tenants', { includeInactive: options?.includeInactive === true }],
    queryFn: async () => {
      const response = await api.get<Tenant[]>('/admin/tenants', {
        params: options?.includeInactive ? { includeInactive: 'true' } : undefined,
      });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    staleTime: 60 * 1000,
  });
}

export function useTenant(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const response = await api.get<Tenant>(`/admin/tenants/${id}`);
      return response.data;
    },
    enabled: !!id && (options?.enabled ?? true),
    staleTime: 60 * 1000,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: TenantMutationPayload) => {
      const response = await api.post<Tenant>('/admin/tenants', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TenantUpdatePayload }) => {
      const response = await api.put<Tenant>(`/admin/tenants/${id}`, data);
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', vars.id] });
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
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
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
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}
