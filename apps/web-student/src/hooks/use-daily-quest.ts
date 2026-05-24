import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export type PracticeQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'ORDERING'
  | 'LISTENING_AUDIO';

export interface GeneratedPracticeQuestion {
  type: PracticeQuestionType;
  prompt: string;
  options?: Array<{ id: string; text: string }>;
  correctAnswer: unknown;
  explanation?: string;
  skillTags: string[];
}

interface GenerateDailyQuestParams {
  courseId?: string;
}

export function useDailyQuest() {
  return useMutation({
    mutationFn: async (params?: GenerateDailyQuestParams) => {
      const response = await api.post('/ai/daily-quest', params || {});
      return response.data?.questions as GeneratedPracticeQuestion[];
    },
  });
}
