import { useQuery } from '@tanstack/react-query';
import { activationApi } from '@/lib/activation-api';

export function useActivationCodes() {
  return useQuery({
    queryKey: ['activation-codes'],
    queryFn: () => activationApi.getCodes(),
    staleTime: 60 * 1000,
  });
}
