import api from './api';

export type LessonType =
  | 'video'
  | 'text'
  | 'quiz'
  | 'simulation'
  | 'micro_card'
  | 'practice'
  | 'exam';

export interface CourseAiSettings {
  enabled: boolean;
  prompt: string;
}

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  content?: string | null;
  aiPrompt?: string | null;
  videoUrl?: string | null;
  duration: number;
  order: number;
  courseId: string;
  unitId?: string | null;
  practiceExerciseSetId?: string | null;
  examId?: string | null;
}

export interface CourseUnit {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  courseId: string;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  isActive: boolean;
  levelId?: string | null;
  aiSettings?: CourseAiSettings | null;
  lessons: Lesson[];
  units?: CourseUnit[];
  enrollments?: CourseEnrollment[];
  _count?: { lessons: number };
}

export interface CourseCreateInput {
  title: string;
  slug?: string;
  description?: string;
  coverImageUrl?: string;
  totalDuration?: number;
  aiSettings?: CourseAiSettings;
  levelId?: string;
  isActive?: boolean;
}

export type CourseUpdateInput = Partial<CourseCreateInput>;

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

export interface CourseEnrollmentReportStudent {
  enrollmentId: string;
  userId: string;
  fullName: string;
  email: string;
  isActive: boolean;
  enrolledAt: string;
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lastActivityAt: string | null;
  activitySessions: number;
  totalTimeSpentSeconds: number;
}

export interface CourseEnrollmentReport {
  course: {
    id: string;
    title: string;
  };
  totals: {
    enrolledStudents: number;
    completedStudents: number;
    inProgressStudents: number;
    notStartedStudents: number;
    totalLessons: number;
    completedLessons: number;
    activitySessions: number;
    totalTimeSpentSeconds: number;
    averageCompletionPercentage: number;
    completionRate: number;
  };
  students: CourseEnrollmentReportStudent[];
}

export interface BulkEnrollmentResult {
  courseId: string;
  requestedCount: number;
  uniqueCount: number;
  processedCount: number;
  skippedCount: number;
  duplicateCount: number;
  processedUserIds: string[];
  skippedUserIds: string[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export type CourseStatusFilter = 'all' | 'published' | 'draft';

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CourseStatusFilter;
}

export const courseApi = {
  // Returns { data: Course[], meta } — caller extracts .data for array
  getCourses(params?: CourseListParams) {
    return api.get('/courses', { params }).then((r) => {
      const raw = r.data as Record<string, unknown>;
      if (Array.isArray(r.data)) {
        return {
          data: r.data as Course[],
          meta: createPaginationMeta(params, r.data.length),
        };
      }
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

  createCourse(data: CourseCreateInput) {
    return api.post('/courses', data).then((r) => r.data as Course);
  },

  updateCourse(id: string, data: CourseUpdateInput) {
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

  bulkEnrollStudents(courseId: string, userIds: string[]) {
    return api
      .post(`/courses/${courseId}/enrollments/bulk`, { userIds })
      .then((r) => r.data as BulkEnrollmentResult);
  },

  bulkUnenrollStudents(courseId: string, userIds: string[]) {
    return api
      .post(`/courses/${courseId}/enrollments/bulk/unenroll`, { userIds })
      .then((r) => r.data as BulkEnrollmentResult);
  },

  getCourseReport(courseId: string) {
    return api.get(`/courses/${courseId}/report`).then((r) => r.data as CourseEnrollmentReport);
  },

  createUnit(courseId: string, data: { title: string; description?: string; order?: number }) {
    return api.post(`/courses/${courseId}/units`, data).then((r) => r.data as CourseUnit);
  },

  updateUnit(
    courseId: string,
    unitId: string,
    data: { title?: string; description?: string; order?: number },
  ) {
    return api
      .patch(`/courses/${courseId}/units/${unitId}`, data)
      .then((r) => r.data as CourseUnit);
  },

  deleteUnit(courseId: string, unitId: string) {
    return api.delete(`/courses/${courseId}/units/${unitId}`).then((r) => r.data as CourseUnit);
  },

  setCourseStatus(id: string, isActive: boolean) {
    return api.patch(`/courses/${id}/status`, { isActive }).then((r) => r.data as Course);
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

  reorderUnits(courseId: string, unitIds: string[]) {
    return api.patch(`/courses/${courseId}/units/reorder`, { unitIds });
  },

  reorderLessons(courseId: string, unitId: string, lessonIds: string[]) {
    return api.patch(`/lessons/reorder`, { courseId, unitId, lessonIds });
  },
};

function createPaginationMeta(params: CourseListParams | undefined, total: number) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? Math.max(total, 1);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function normalizeCourseAiSettings(value: unknown): CourseAiSettings {
  if (!value || typeof value !== 'object') {
    return { enabled: false, prompt: '' };
  }

  const record = value as Record<string, unknown>;
  return {
    enabled: Boolean(record.enabled),
    prompt: typeof record.prompt === 'string' ? record.prompt : '',
  };
}

export function buildCourseAiSettings(enabled: boolean, prompt: string): CourseAiSettings {
  return {
    enabled,
    prompt: prompt.trim(),
  };
}
