import { useQuery } from '@tanstack/react-query';
import { adminUserApi } from '@/lib/admin-user-api';

export function useStudents(params?: { email?: string }) {
  return useQuery({
    queryKey: ['admin-students', params],
    queryFn: () => adminUserApi.getStudents({ ...params, limit: 100, isActive: true }),
    staleTime: 60 * 1000,
  });
}
