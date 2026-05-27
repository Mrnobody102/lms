import api from './api';

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'quiz' | 'simulation' | 'micro_card' | 'practice' | 'exam';
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
  lessons?: Lesson[];
  units?: CourseUnit[];
  _count?: { lessons: number };
  description?: string | null;
  totalDuration?: number;
  coverImageUrl?: string | null;
  levelId?: string | null;
  level?: {
    id: string;
    title: string;
    program?: {
      id: string;
      title: string;
    };
  } | null;
}

export type CourseActivityType = 'LESSON' | 'PRACTICE' | 'EXAM' | 'ROLEPLAY';
export type CourseActivityProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface CourseActivityTarget {
  id: string;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  questionCount?: number;
  sectionCount?: number;
  attemptCount?: number;
  href: string;
}

export interface CourseActivityProgress {
  status: CourseActivityProgressStatus;
  completedAt: string | null;
  lastAccessedAt: string | null;
  scorePercent: number | null;
}

export interface CourseActivity {
  id: string;
  type: CourseActivityType;
  targetId: string;
  courseId: string;
  unitId: string | null;
  order: number;
  isRequired: boolean;
  isPublished: boolean;
  estimatedMinutes: number;
  availableFrom: string | null;
  dueAt: string | null;
  completionPolicy: string;
  progress: CourseActivityProgress | null;
  target: CourseActivityTarget;
}

export interface CourseActivitiesResponse {
  course: {
    id: string;
    title: string;
    totalDuration?: number | null;
  };
  units: Array<{
    id: string;
    title: string;
    description?: string | null;
    order: number;
    activities: CourseActivity[];
  }>;
  ungroupedActivities: CourseActivity[];
}

export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedCoursesResponse {
  data: Course[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const courseApi = {
  getCourses: async (params?: CourseListParams): Promise<PaginatedCoursesResponse> => {
    const response = await api.get('/courses', { params });
    const raw = response.data as unknown;
    if (isRecord(raw) && raw.success === false) {
      const msg = raw.message || 'Failed to load courses';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    if (isPaginatedCoursesResponse(raw)) {
      return raw;
    }
    if (Array.isArray(raw)) {
      return {
        data: raw as Course[],
        meta: createPaginationMeta(params, raw.length),
      };
    }
    return {
      data: [],
      meta: createPaginationMeta(params, 0),
    };
  },

  getCourse: async (id: string) => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  getLesson: async (id: string) => {
    const response = await api.get<Lesson>(`/lessons/${id}`);
    return response.data;
  },

  getCourseActivities: async (id: string) => {
    const response = await api.get<CourseActivitiesResponse>(`/courses/${id}/activities`);
    return response.data;
  },
};

function isPaginatedCoursesResponse(value: unknown): value is PaginatedCoursesResponse {
  if (!isRecord(value)) {
    return false;
  }

  const meta = value.meta;
  return (
    Array.isArray(value.data) &&
    !!meta &&
    typeof meta === 'object' &&
    typeof (meta as Record<string, unknown>).page === 'number' &&
    typeof (meta as Record<string, unknown>).limit === 'number' &&
    typeof (meta as Record<string, unknown>).total === 'number' &&
    typeof (meta as Record<string, unknown>).totalPages === 'number'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

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
