import { useQuery } from '@tanstack/react-query';
import { adaptiveApi } from '@/lib/adaptive-api';

export function useLearnerNextSteps(userId: string, enabled = true) {
  return useQuery({
    queryKey: ['admin-learner-next-steps', userId],
    queryFn: () => adaptiveApi.getLearnerNextSteps(userId),
    enabled: enabled && Boolean(userId),
    staleTime: 60 * 1000,
  });
}
