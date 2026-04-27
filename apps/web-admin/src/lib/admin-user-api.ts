import api from './api';

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  isActive: boolean;
  tenantId: string;
  createdAt?: string;
  updatedAt?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface AdminOverview {
  totals: {
    totalStudents: number;
    newStudents7d: number;
    inactiveStudents: number;
    activeCourses: number;
    activeEnrollments: number;
    trackedSessions: number;
    completionRate: number;
  };
  recentRegistrations: Array<{
    id: string;
    email: string;
    fullName: string | null;
    isActive: boolean;
    createdAt: string;
    latestCourseTitle: string | null;
  }>;
}

export const adminUserApi = {
  getOverview() {
    return api.get('/admin/overview').then((r) => r.data as AdminOverview);
  },

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

  updateUserStatus(userId: string, isActive: boolean) {
    return api
      .patch(`/admin/users/${userId}/status`, { isActive })
      .then((r) => r.data as AdminUser);
  },
};
