import { useQuery } from '@tanstack/react-query';
import { adminUserApi } from '@/lib/admin-user-api';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminUserApi.getOverview(),
    staleTime: 60 * 1000,
  });
}

export function useStudents(params?: { search?: string }) {
  return useQuery({
    queryKey: ['admin-students', params],
    queryFn: () => adminUserApi.getStudents({ search: params?.search, limit: 100, isActive: true }),
    staleTime: 60 * 1000,
  });
}
