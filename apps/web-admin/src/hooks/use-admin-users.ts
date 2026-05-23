import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUserApi } from '@/lib/admin-user-api';

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminUserApi.getOverview(),
    staleTime: 60 * 1000,
  });
}

export function useStudents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  email?: string;
  isActive?: boolean;
  cohortId?: string;
}) {
  return useQuery({
    queryKey: ['admin-students', params],
    queryFn: () =>
      adminUserApi.getStudents({
        page: params?.page ?? 1,
        search: params?.search,
        email: params?.email,
        limit: params?.limit ?? 20,
        isActive: params?.isActive,
        cohortId: params?.cohortId,
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
