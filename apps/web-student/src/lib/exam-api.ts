import api from './api';

export type ExamQuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK';

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  options?: unknown;
  explanation?: string | null;
  points: number;
  skillTags: string[];
}

export interface ExamSection {
  id: string;
  title: string;
  order: number;
  questions: ExamQuestion[];
}

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

export interface Exam extends ExamSummary {
  sections: ExamSection[];
}

export interface ExamAttempt {
  id: string;
  examId: string;
  score: number;
  totalPoints: number;
  status: 'STARTED' | 'SUBMITTED';
  startedAt: string;
  deadlineAt: string;
  isExpired: boolean;
  submittedAt?: string | null;
}

export interface ExamAnswerFeedback {
  questionId: string;
  prompt: string;
  answer: unknown;
  isCorrect: boolean;
  pointsAwarded: number;
  correctAnswer: unknown;
  explanation?: string | null;
}

export interface ExamAttemptResult {
  attempt: ExamAttempt;
  result: {
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean | null;
    answers: ExamAnswerFeedback[];
  };
}

export const examApi = {
  getExams(params?: { courseId?: string; unitId?: string }) {
    return api.get('/exams', { params }).then((response) => response.data as ExamSummary[]);
  },

  getExam(id: string) {
    return api.get(`/exams/${id}`).then((response) => response.data as Exam);
  },

  startAttempt(id: string) {
    return api
      .post(`/exams/${id}/attempts`)
      .then((response) => response.data as { attempt: ExamAttempt; exam: Exam; resumed: boolean });
  },

  submitAttempt(attemptId: string, answers: Array<{ questionId: string; answer: unknown }>) {
    return api
      .post(`/exams/attempts/${attemptId}/submit`, { answers })
      .then((response) => response.data as ExamAttemptResult);
  },
};
