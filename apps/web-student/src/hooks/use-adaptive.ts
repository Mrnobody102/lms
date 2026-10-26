import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  adaptiveApi,
  type AdaptiveNextStepsParams,
  type AdaptivePathStatusUpdate,
} from '@/lib/adaptive-api';

export function useAdaptiveNextSteps(params?: AdaptiveNextStepsParams, enabled = true) {
  const { user, isInitialized, isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['adaptive-next-steps', user?.tenantId, user?.id, params],
    queryFn: () => adaptiveApi.getNextSteps(params),
    enabled: enabled && isInitialized && isAuthenticated && user?.role === 'STUDENT',
    staleTime: 30 * 1000,
  });
}

export function useUpdateAdaptivePathStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdaptivePathStatusUpdate }) =>
      adaptiveApi.updatePathItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adaptive-next-steps'] });
    },
  });
}
