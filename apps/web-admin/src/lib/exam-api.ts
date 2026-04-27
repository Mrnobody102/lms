import api from './api';

export type ExamQuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK';

export interface ExamSummary {
  id: string;
  courseId: string;
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

export interface ExamQuestion {
  type: ExamQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer: unknown;
  explanation?: string;
  points?: number;
  skillTags?: string[];
}

export interface ExamSection {
  title: string;
  order?: number;
  questions: ExamQuestion[];
}

export const examApi = {
  getExams(params?: { courseId?: string; unitId?: string }) {
    return api.get('/exams', { params }).then((response) => response.data as ExamSummary[]);
  },

  createExam(data: {
    courseId: string;
    unitId?: string;
    title: string;
    description?: string;
    durationMinutes?: number;
    passingScore?: number;
    isPublished?: boolean;
    sections: ExamSection[];
  }) {
    return api.post('/exams', data).then((response) => response.data as ExamSummary);
  },
};
