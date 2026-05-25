import api from './api';

export type ExamQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'ORDERING'
  | 'AI_EVALUATED_AUDIO'
  | 'AI_EVALUATED_TEXT';

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer: unknown;
  explanation?: string | null;
  points: number;
  skillTags: string[];
  audioMediaAssetId?: string | null;
  audioMediaAsset?: { id: string; url: string | null; status?: string } | null;
  audioReplayLimit?: number | null;
}

export interface ExamSection {
  id: string;
  title: string;
  order: number;
  questions: ExamQuestion[];
}

export interface ExamSummary {
  id: string;
  courseId?: string | null;
  unitId?: string | null;
  title: string;
  description?: string | null;
  durationMinutes: number;
  passingScore?: number | null;
  isPublished: boolean;
  course?: { id: string; title: string };
  unit?: { id: string; title: string } | null;
  _count?: { sections: number; attempts: number };
}

export interface Exam extends ExamSummary {
  sections: ExamSection[];
}

export const examApi = {
  getExams(params?: { courseId?: string; unitId?: string }) {
    return api.get('/exams', { params }).then((response) => response.data as ExamSummary[]);
  },

  getExam(id: string) {
    return api.get(`/exams/${id}`).then((response) => response.data as Exam);
  },

  createExam(data: {
    courseId?: string;
    unitId?: string;
    title: string;
    description?: string;
    durationMinutes?: number;
    passingScore?: number;
    isPublished?: boolean;
    sections: Array<{
      title: string;
      order?: number;
      questions: Array<{
        type: ExamQuestionType;
        prompt: string;
        options?: unknown;
        correctAnswer: unknown;
        explanation?: string;
        points?: number;
        skillTags?: string[];
        audioMediaAssetId?: string | null;
        audioReplayLimit?: number | null;
      }>;
    }>;
  }) {
    return api.post('/exams', data).then((response) => response.data as ExamSummary);
  },

  updateExam(
    id: string,
    data: {
      unitId?: string | null;
      title?: string;
      description?: string | null;
      durationMinutes?: number;
      passingScore?: number | null;
      isPublished?: boolean;
      sections?: Array<{
        title: string;
        order?: number;
        questions: Array<{
          type: ExamQuestionType;
          prompt: string;
          options?: unknown;
          correctAnswer: unknown;
          explanation?: string;
          points?: number;
          skillTags?: string[];
          audioMediaAssetId?: string | null;
          audioReplayLimit?: number | null;
        }>;
      }>;
    },
  ) {
    return api.patch(`/exams/${id}`, data).then((response) => response.data as Exam);
  },

  deleteExam(id: string) {
    return api.delete(`/exams/${id}`).then((response) => response.data as ExamSummary);
  },
};
