import api from './api';

export type PracticeQuestionType = 'MULTIPLE_CHOICE' | 'FILL_BLANK';

export interface PracticeQuestion {
  id: string;
  type: PracticeQuestionType;
  prompt: string;
  options?: unknown;
  explanation?: string | null;
  skillTags: string[];
}

export interface PracticeExerciseSetSummary {
  id: string;
  courseId: string;
  unitId?: string | null;
  title: string;
  description?: string | null;
  isPublished: boolean;
  course?: { id: string; title: string };
  unit?: { id: string; title: string } | null;
  _count?: { questions: number; attempts: number };
}

export interface PracticeExerciseSetQuestion {
  id: string;
  order: number;
  question: PracticeQuestion;
}

export interface PracticeExerciseSet extends PracticeExerciseSetSummary {
  questions: PracticeExerciseSetQuestion[];
}

export interface PracticeAnswerFeedback {
  questionId: string;
  prompt: string;
  answer: unknown;
  isCorrect: boolean;
  correctAnswer: unknown;
  explanation?: string | null;
}

export interface PracticeAttemptResult {
  attempt: {
    id: string;
    score: number;
    totalPoints: number;
    submittedAt: string;
  };
  result: {
    score: number;
    totalPoints: number;
    percentage: number;
    answers: PracticeAnswerFeedback[];
  };
}

export interface PracticeAttemptSummary {
  id: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  exerciseSet: {
    id: string;
    title: string;
    course: { id: string; title: string };
    unit?: { id: string; title: string } | null;
  };
}

export interface PracticeAttemptDetail extends PracticeAttemptSummary {
  answers: Array<{
    id: string;
    answer: unknown;
    isCorrect: boolean;
    createdAt: string;
    question: PracticeQuestion & { correctAnswer: unknown };
  }>;
  exerciseSet: PracticeAttemptSummary['exerciseSet'] & {
    description?: string | null;
  };
}

export const practiceApi = {
  getExerciseSets(params?: { courseId?: string; unitId?: string }) {
    return api
      .get('/practice/exercise-sets', { params })
      .then((response) => response.data as PracticeExerciseSetSummary[]);
  },

  getExerciseSet(id: string) {
    return api
      .get(`/practice/exercise-sets/${id}`)
      .then((response) => response.data as PracticeExerciseSet);
  },

  submitAttempt(id: string, answers: Array<{ questionId: string; answer: unknown }>) {
    return api
      .post(`/practice/exercise-sets/${id}/attempts`, { answers })
      .then((response) => response.data as PracticeAttemptResult);
  },

  getAttempts(params?: { courseId?: string; exerciseSetId?: string; limit?: number }) {
    return api
      .get('/practice/attempts', { params })
      .then((response) => response.data as PracticeAttemptSummary[]);
  },

  getAttempt(id: string) {
    return api
      .get(`/practice/attempts/${id}`)
      .then((response) => response.data as PracticeAttemptDetail);
  },
};
