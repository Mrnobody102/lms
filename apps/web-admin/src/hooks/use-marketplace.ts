import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useMarketplaceItems(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['marketplace', 'items', query],
    queryFn: async () => {
      const { data } = await api.get('/marketplace/items', { params: query });
      return data;
    },
  });
}

export function useProviderItems(query?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['marketplace', 'provider-items', query],
    queryFn: async () => {
      const { data } = await api.get('/marketplace/my-items', { params: query });
      return data;
    },
  });
}

export function useMarketplaceSubscriptions() {
  return useQuery({
    queryKey: ['marketplace', 'subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/marketplace/subscriptions');
      return data;
    },
  });
}

export function usePublishMarketplaceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post('/marketplace/items', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'provider-items'] });
    },
  });
}

export function useSubscribeMarketplaceItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload?: Record<string, unknown> }) => {
      const { data } = await api.post(`/marketplace/items/${id}/subscriptions`, payload || {});
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace', 'items'] });
    },
  });
}
