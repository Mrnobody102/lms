import { useQuery } from '@tanstack/react-query';
import { courseRunApi } from '@/lib/course-run-api';

export function useCourseRuns(enabled = true) {
  return useQuery({
    queryKey: ['course-runs'],
    queryFn: () => courseRunApi.list(),
    enabled,
    staleTime: 60 * 1000,
  });
}
