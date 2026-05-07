import { useQuery } from '@tanstack/react-query';
import { progressApi } from '@/lib/progress-api';

export function usePerformance(courseId?: string) {
  return useQuery({
    queryKey: ['performance-report', courseId],
    queryFn: () => progressApi.getPerformance(courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
