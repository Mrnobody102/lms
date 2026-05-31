import { useQuery } from '@tanstack/react-query';
import { courseRunApi } from '@/lib/course-run-api';

export function useCourseRuns() {
  return useQuery({
    queryKey: ['course-runs'],
    queryFn: () => courseRunApi.list(),
    staleTime: 60 * 1000,
  });
}
