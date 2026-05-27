import api from './api';

export type TodayTaskType =
  | 'ACTIVE_EXAM'
  | 'REVIEW_DUE'
  | 'CONTINUE_COURSE'
  | 'WEAK_SKILL_PRACTICE'
  | 'BROWSE_COURSES';

export interface TodayTask {
  id: string;
  type: TodayTaskType;
  title: string;
  subtitle: string;
  href: string;
  priority: number;
  dueAt: string | null;
  meta: Record<string, string | number | boolean | null>;
}

export interface TodayCourseSummary {
  course: {
    id: string;
    title: string;
    totalDuration?: number | null;
  };
  totalLessons: number;
  completedLessons: number;
  completionPercentage: number;
  lastActivityAt: string | null;
  continueLesson: {
    id: string;
    title: string;
    courseId: string;
    duration: number;
  } | null;
}

export interface TodayFeedbackItem {
  id: string;
  title: string;
  courseTitle: string | null;
  unitTitle: string | null;
  score: number;
  totalPoints: number;
  percentage: number;
  submittedAt: string;
  href: string;
}

export interface StudentTodayResponse {
  primaryTask: TodayTask;
  tasks: TodayTask[];
  courses: TodayCourseSummary[];
  srsDue: {
    dueNow: number;
    dueToday: number;
    total: number;
  };
  recentFeedback: {
    practice: TodayFeedbackItem[];
    exams: TodayFeedbackItem[];
  };
}

export const studentApi = {
  getToday: async () => {
    const response = await api.get<StudentTodayResponse>('/student/today');
    return response.data;
  },
};
