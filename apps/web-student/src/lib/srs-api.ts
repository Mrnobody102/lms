import api from './api';

export type ReviewCardSource = 'PRACTICE_QUESTION' | 'EXAM_QUESTION' | 'CUSTOM';
export type ReviewCardGrade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY';

export interface QueueQuestionPayload {
  id: string;
  prompt: string;
  type: string;
  options: unknown;
  correctAnswer: unknown;
  explanation: string | null;
  audioMediaAsset: { id: string; url: string | null } | null;
  audioReplayLimit: number | null;
}

export interface ReviewQueueItem {
  cardId: string;
  sourceType: ReviewCardSource;
  question: QueueQuestionPayload | null;
  skillCodes: string[];
  dueAt: string;
  reps: number;
  lapses: number;
  easeFactor: number;
}

export interface DueSummary {
  dueNow: number;
  dueToday: number;
  total: number;
}

export interface CustomCardContent {
  front: string;
  back?: string;
  pinyin?: string;
  example?: string;
}

export interface CustomCardPayload {
  customContent: CustomCardContent;
  skillCodes?: string[];
}

export interface ReviewCard {
  id: string;
  sourceType: ReviewCardSource;
  sourceId: string;
  skillCodes: string[];
  easeFactor: number;
  interval: number;
  reps: number;
  lapses: number;
  dueAt: string;
  customContent?: CustomCardContent;
}

export interface ReviewStat {
  date: string;
  count: number;
}

export const srsApi = {
  getQueue: async (params?: { limit?: number; skill?: string }) => {
    const response = await api.get<ReviewQueueItem[]>('/srs/queue', { params });
    return response.data;
  },

  submitReview: async (cardId: string, grade: ReviewCardGrade, durationMs?: number) => {
    const response = await api.post(`/srs/review/${cardId}`, { grade, durationMs });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get<DueSummary>('/srs/summary');
    return response.data;
  },

  getStats: async (days: number = 30) => {
    const response = await api.get<ReviewStat[]>('/srs/stats', { params: { days } });
    return response.data;
  },

  getCustomCards: async () => {
    const response = await api.get<ReviewCard[]>('/srs/cards/custom');
    return response.data;
  },

  createCustomCard: async (data: CustomCardPayload) => {
    const response = await api.post<ReviewCard>('/srs/cards/custom', data);
    return response.data;
  },

  updateCustomCard: async (cardId: string, data: CustomCardPayload) => {
    const response = await api.put<ReviewCard>(`/srs/cards/custom/${cardId}`, data);
    return response.data;
  },

  deleteCustomCard: async (cardId: string) => {
    const response = await api.delete(`/srs/cards/custom/${cardId}`);
    return response.data;
  },
};
