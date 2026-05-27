import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/student-api';

export function useStudentToday(enabled = true) {
  return useQuery({
    queryKey: ['student-today'],
    queryFn: () => studentApi.getToday(),
    enabled,
    staleTime: 30 * 1000,
  });
}
