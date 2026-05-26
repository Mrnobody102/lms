import { useQuery } from '@tanstack/react-query';
import { userStatsApi } from '../lib/user-stats-api';

export const profileStatsKeys = {
  all: ['profile-stats'] as const,
};

export function useProfileStats(enabled = true) {
  return useQuery({
    queryKey: profileStatsKeys.all,
    queryFn: () => userStatsApi.getStats(),
    enabled,
  });
}
