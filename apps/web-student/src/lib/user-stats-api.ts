import { defaultApiClient } from '@repo/api-client';

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  totalTimeLearnedSeconds: number;
  completedLessons: number;
  recentActivities: Array<{
    id: string;
    type: string;
    occurredAt: string;
    lessonTitle?: string;
    courseTitle?: string;
  }>;
}

export const userStatsApi = {
  getStats: async (): Promise<UserStats> => {
    const { data } = await defaultApiClient.get<UserStats>('/users/me/stats');
    return data;
  },
};
