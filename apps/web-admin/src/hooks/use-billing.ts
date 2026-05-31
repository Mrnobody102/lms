import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { billingApi, type UpdateBillingConfigPayload } from '@/lib/billing-api';

export function useBillingConfig() {
  return useQuery({
    queryKey: ['admin-billing-config'],
    queryFn: () => billingApi.getConfig(),
    staleTime: 60 * 1000,
  });
}

export function useBillingOverview() {
  return useQuery({
    queryKey: ['admin-billing-overview'],
    queryFn: () => billingApi.getOverview(),
    staleTime: 60 * 1000,
  });
}

export function useUpdateBillingConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateBillingConfigPayload) => billingApi.updateConfig(payload),
    onSuccess: (config) => {
      queryClient.setQueryData(['admin-billing-config'], config);
    },
  });
}
