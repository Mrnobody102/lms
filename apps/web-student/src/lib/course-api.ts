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

export const courseApi = {
  getCourses: async () => {
    const response = await api.get<Course[]>('/courses');
    const raw = response.data as unknown as Record<string, unknown>;
    if (raw && raw.success === false) {
      const msg = raw.message || 'Failed to load courses';
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    if (raw && raw.data && Array.isArray(raw.data)) {
      return raw.data as Course[];
    }
    if (Array.isArray(raw)) return raw;
    return [];
  },

  getCourse: async (id: string) => {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  getLesson: async (id: string) => {
    const response = await api.get<Lesson>(`/lessons/${id}`);
    return response.data;
  },
};
