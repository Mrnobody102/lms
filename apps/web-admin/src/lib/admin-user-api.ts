import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  isActive: boolean;
  tenantId: string;
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const adminUserApi = {
  getStudents(params?: { page?: number; limit?: number; search?: string; isActive?: boolean }) {
    return api
      .get('/admin/users', {
        params: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 100,
          role: 'STUDENT',
          search: params?.search,
          isActive: params?.isActive ?? true,
        },
      })
      .then((r) => r.data as PaginatedResponse<AdminUser>);
  },
};
