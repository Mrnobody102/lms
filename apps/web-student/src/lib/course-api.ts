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
  quiz?: {
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
    }[];
  };
}

export interface Course {
  id: string;
  title: string;
  lessons?: Lesson[];
  totalDuration?: number;
}

export const courseApi = {
  getCourses: async () => {
    const response = await api.get<Course[]>('/courses');
    const raw = response.data as Record<string, unknown>;
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
