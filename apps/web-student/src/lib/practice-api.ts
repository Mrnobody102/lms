import api from './api';

export type PracticeQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'AI_EVALUATED_AUDIO'
  | 'AI_EVALUATED_TEXT';

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
  aiFeedback?: unknown;
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

export interface PracticeAttemptStats {
  answeredCount: number;
  aiAnsweredCount: number;
  aiReviewedCount: number;
  aiPendingCount: number;
}

export interface PracticeAttemptSummary {
  id: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  stats?: PracticeAttemptStats;
  exerciseSet: {
    id: string;
    title: string;
    course: { id: string; title: string };
    unit?: { id: string; title: string } | null;
  };
}

export function getPracticeAttemptStats(
  attempt: Pick<PracticeAttemptSummary, 'stats' | 'totalPoints'> & {
    answers?: Array<{ question: PracticeQuestion; aiFeedback?: unknown }>;
  },
): PracticeAttemptStats {
  if (attempt.stats) {
    return attempt.stats;
  }

  const answers = attempt.answers ?? [];
  const aiAnsweredCount = answers.filter((answer) => isAiQuestionType(answer.question.type)).length;
  const aiReviewedCount = answers.filter(
    (answer) => isAiQuestionType(answer.question.type) && Boolean(answer.aiFeedback),
  ).length;

  return {
    answeredCount: answers.length || attempt.totalPoints,
    aiAnsweredCount,
    aiReviewedCount,
    aiPendingCount: Math.max(aiAnsweredCount - aiReviewedCount, 0),
  };
}

function isAiQuestionType(type: PracticeQuestionType) {
  return type === 'AI_EVALUATED_AUDIO' || type === 'AI_EVALUATED_TEXT';
}

export interface PracticeAttemptDetail extends PracticeAttemptSummary {
  answers: Array<{
    id: string;
    answer: unknown;
    isCorrect: boolean;
    aiFeedback?: unknown;
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
