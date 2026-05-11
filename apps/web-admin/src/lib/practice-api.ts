import api from './api';

export type PracticeQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'AI_EVALUATED_AUDIO'
  | 'AI_EVALUATED_TEXT';

export interface PracticeQuestion {
  id: string;
  courseId: string;
  unitId?: string | null;
  type: PracticeQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer: unknown;
  explanation?: string | null;
  skillTags: string[];
  createdAt: string;
}

export interface PracticeExerciseSet {
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

export interface PracticeExerciseSetDetail extends PracticeExerciseSet {
  questions: Array<{
    id: string;
    order: number;
    question: PracticeQuestion;
  }>;
}

export const practiceApi = {
  getQuestions(params?: { courseId?: string; unitId?: string }) {
    return api.get('/practice/questions', { params }).then((r) => r.data as PracticeQuestion[]);
  },

  createQuestion(data: {
    courseId: string;
    unitId?: string;
    type: PracticeQuestionType;
    prompt: string;
    options?: unknown;
    correctAnswer: unknown;
    explanation?: string;
    skillTags?: string[];
  }) {
    return api.post('/practice/questions', data).then((r) => r.data as PracticeQuestion);
  },

  updateQuestion(
    id: string,
    data: {
      unitId?: string | null;
      type?: PracticeQuestionType;
      prompt?: string;
      options?: unknown;
      correctAnswer?: unknown;
      explanation?: string | null;
      skillTags?: string[];
    },
  ) {
    return api.patch(`/practice/questions/${id}`, data).then((r) => r.data as PracticeQuestion);
  },

  deleteQuestion(id: string) {
    return api.delete(`/practice/questions/${id}`).then((r) => r.data as PracticeQuestion);
  },

  getExerciseSets(params?: { courseId?: string; unitId?: string }) {
    return api
      .get('/practice/exercise-sets', { params })
      .then((r) => r.data as PracticeExerciseSet[]);
  },

  createExerciseSet(data: {
    courseId: string;
    unitId?: string;
    title: string;
    description?: string;
    isPublished?: boolean;
    questionIds: string[];
  }) {
    return api.post('/practice/exercise-sets', data).then((r) => r.data as PracticeExerciseSet);
  },

  getExerciseSet(id: string) {
    return api
      .get(`/practice/exercise-sets/${id}`)
      .then((r) => r.data as PracticeExerciseSetDetail);
  },

  updateExerciseSet(
    id: string,
    data: {
      unitId?: string | null;
      title?: string;
      description?: string | null;
      isPublished?: boolean;
      questionIds?: string[];
    },
  ) {
    return api
      .patch(`/practice/exercise-sets/${id}`, data)
      .then((r) => r.data as PracticeExerciseSet);
  },

  deleteExerciseSet(id: string) {
    return api.delete(`/practice/exercise-sets/${id}`).then((r) => r.data as PracticeExerciseSet);
  },
};
