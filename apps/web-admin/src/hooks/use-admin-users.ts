import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminUserApi,
  type CreateInstructorPayload,
  type UpdateAdminUserPayload,
} from '@/lib/admin-user-api';

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

export function useStudentDetail(userId: string) {
  return useQuery({
    queryKey: ['admin-student-detail', userId],
    queryFn: () => adminUserApi.getStudentById(userId),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () => adminUserApi.getUserById(userId),
    enabled: Boolean(userId),
    staleTime: 60 * 1000,
  });
}

export function useInstructors(params?: {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['admin-instructors', params],
    queryFn: () =>
      adminUserApi.getInstructors({
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        search: params?.search,
        isActive: params?.isActive,
      }),
    staleTime: 60 * 1000,
  });
}

export function useCreateInstructor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateInstructorPayload) => adminUserApi.createInstructor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateAdminUserPayload }) =>
      adminUserApi.updateUser(userId, payload),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-student-detail', updatedUser.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}

export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminUserApi.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['admin-instructors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
  });
}
