import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUserApi } from '@/lib/admin-user-api';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminUserApi.getOverview(),
    staleTime: 60 * 1000,
  });
}

export function useStudents(params?: { search?: string; isActive?: boolean }) {
  return useQuery({
    queryKey: ['admin-students', params],
    queryFn: () =>
      adminUserApi.getStudents({
        search: params?.search,
        limit: 100,
        isActive: params?.isActive,
      }),
    staleTime: 60 * 1000,
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminUserApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}
