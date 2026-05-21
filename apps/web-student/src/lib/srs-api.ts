import api from './api';

export type ReviewCardSource = 'PRACTICE_QUESTION' | 'EXAM_QUESTION';
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

export const srsApi = {
  getQueue: async (params?: { limit?: number; skill?: string }) => {
    const response = await api.get<ReviewQueueItem[]>('/srs/queue', { params });
    return response.data;
  },

  submitReview: async (cardId: string, grade: ReviewCardGrade) => {
    const response = await api.post(`/srs/review/${cardId}`, { grade });
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get<DueSummary>('/srs/summary');
    return response.data;
  },
};
