import api from './api';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz';
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  courseId: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  lessons: Lesson[];
  enrollments?: CourseEnrollment[];
  _count?: { lessons: number };
}

export interface CourseEnrollment {
  id: string;
  userId: string;
  courseId: string;
  tenantId: string;
  status: 'ACTIVE' | 'REVOKED';
  enrolledAt: string;
  unenrolledAt?: string | null;
  user?: {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const courseApi = {
  // Returns { data: Course[], meta } — caller extracts .data for array
  getCourses(params?: { page?: number; limit?: number; search?: string }) {
    return api.get('/courses', { params }).then((r) => {
      const raw = r.data as Record<string, unknown>;
      if (raw && raw.success === false) {
        const msg = raw.message || 'Failed to load courses';
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      }
      if (raw && raw.data && Array.isArray(raw.data)) {
        return { data: raw.data as Course[], meta: raw.meta as PaginatedResponse<Course>['meta'] };
      }
      return r.data as PaginatedResponse<Course>;
    });
  },

  getCourse(id: string) {
    return api.get(`/courses/${id}`).then((r) => r.data as Course);
  },

  createCourse(data: {
    title: string;
    slug?: string;
    description?: string;
    totalDuration?: number;
  }) {
    return api.post('/courses', data).then((r) => r.data as Course);
  },

  updateCourse(id: string, data: Partial<Course>) {
    return api.patch(`/courses/${id}`, data).then((r) => r.data as Course);
  },

  deleteCourse(id: string) {
    return api.delete(`/courses/${id}`);
  },

  enrollStudent(courseId: string, userId: string) {
    return api
      .post(`/courses/${courseId}/enrollments`, { userId })
      .then((r) => r.data as CourseEnrollment);
  },

  unenrollStudent(courseId: string, userId: string) {
    return api
      .delete(`/courses/${courseId}/enrollments/${userId}`)
      .then((r) => r.data as CourseEnrollment);
  },

  createLesson(courseId: string, data: Partial<Lesson>) {
    return api.post('/lessons', { ...data, courseId }).then((r) => r.data as Lesson);
  },

  updateLesson(id: string, data: Partial<Lesson>) {
    return api.patch(`/lessons/${id}`, data).then((r) => r.data as Lesson);
  },

  deleteLesson(id: string) {
    return api.delete(`/lessons/${id}`);
  },

  // Returns { data: Lesson[], meta } — caller extracts .data for array
  getLessons(courseId: string, params?: { page?: number; limit?: number }) {
    return api
      .get('/lessons', { params: { ...params, courseId } })
      .then((r) => r.data as PaginatedResponse<Lesson>);
  },
};
