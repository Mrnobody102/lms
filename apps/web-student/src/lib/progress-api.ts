import api from './api';

export enum ProgressStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum LearningActivityType {
  LESSON_OPENED = 'LESSON_OPENED',
  LESSON_COMPLETED = 'LESSON_COMPLETED',
}

export interface UserLessonProgress {
  id: string;
  lessonId: string;
  status: ProgressStatus;
  updatedAt: string;
}

export interface CourseProgressSummary {
  course: {
    id: string;
    title: string;
    totalDuration?: number;
  };
  totalLessons: number;
  completedLessons: number;
  activitySessions: number;
  completionPercentage: number;
  lastActivityAt: string | null;
  lastAccessedLesson: {
    id: string;
    title: string;
    courseId: string;
    duration: number;
  } | null;
  continueLesson: {
    id: string;
    title: string;
    courseId: string;
    duration: number;
  } | null;
}

export interface LearningProgressSummary {
  activeCourse: CourseProgressSummary | null;
  courses: CourseProgressSummary[];
  activityCalendar: {
    date: string;
    sessions: number;
    completedLessons: number;
    timeSpentSeconds: number;
  }[];
  totals: {
    courses: number;
    lessons: number;
    completedLessons: number;
    activitySessions: number;
    currentStreak: number;
    completionPercentage: number;
  };
}
export interface LearningActivityRecord {
  id: string;
  lessonId: string;
  courseId: string;
  type: LearningActivityType;
  occurredAt: string;
  timeSpentSeconds?: number | null;
}

export interface PerformanceReport {
  accuracyByUnit: {
    id: string;
    title: string;
    accuracy: number;
    totalQuestions: number;
  }[];
  accuracyBySkill: {
    skill: string;
    accuracy: number;
    totalQuestions: number;
  }[];
}

export const progressApi = {
  updateProgress: async (lessonId: string, status: ProgressStatus) => {
    const response = await api.post<UserLessonProgress>('/progress/update', {
      lessonId,
      status,
    });
    return response.data;
  },

  getCourseProgress: async (courseId: string) => {
    const response = await api.get<UserLessonProgress[]>(`/progress/course/${courseId}`);
    return response.data;
  },

  getLessonProgress: async (lessonId: string) => {
    const response = await api.get<UserLessonProgress>(`/progress/lesson/${lessonId}`);
    return response.data;
  },

  recordActivity: async (
    lessonId: string,
    type: LearningActivityType,
    timeSpentSeconds?: number,
  ) => {
    const response = await api.post<LearningActivityRecord>('/progress/activity', {
      lessonId,
      type,
      timeSpentSeconds,
    });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get<LearningProgressSummary>('/progress/summary');
    return response.data;
  },
  getPerformance: async (courseId?: string) => {
    const response = await api.get<PerformanceReport>('/progress/performance', {
      params: { courseId },
    });
    return response.data;
  },
};
