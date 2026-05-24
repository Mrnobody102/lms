import api from './api';

export type PracticeQuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'ORDERING'
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
  audioMediaAssetId?: string | null;
  audioMediaAsset?: { id: string; url: string | null; status: string } | null;
  audioReplayLimit?: number | null;
  aiGenerated?: boolean;
  reviewStatus?: 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';
  createdAt: string;
}

export type AiGenerationJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type AiDraftReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export interface AiGeneratedQuestionDraft {
  id: string;
  tenantId: string;
  jobId: string;
  courseId: string;
  unitId?: string | null;
  type: PracticeQuestionType;
  prompt: string;
  options?: unknown;
  correctAnswer: unknown;
  explanation?: string | null;
  skillTags: string[];
  difficulty?: string | null;
  validationIssues?: unknown;
  reviewStatus: AiDraftReviewStatus;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  approvedQuestionId?: string | null;
  createdAt: string;
}

export interface AiQuestionGenerationJob {
  id: string;
  courseId: string;
  unitId?: string | null;
  topic: string;
  context?: string | null;
  questionType: PracticeQuestionType;
  requestedCount: number;
  skillTags: string[];
  status: AiGenerationJobStatus;
  promptVersion: string;
  sourceReason?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  course?: { id: string; title: string };
  unit?: { id: string; title: string } | null;
  drafts?: AiGeneratedQuestionDraft[];
  _count?: { drafts: number };
}

export interface PaginatedAiGenerationJobs {
  data: AiQuestionGenerationJob[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AiBulkApproveResult {
  approved: number;
  failed: number;
}

export interface AiBulkRejectResult {
  rejected: number;
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
    audioMediaAssetId?: string;
    audioReplayLimit?: number;
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
      audioMediaAssetId?: string | null;
      audioReplayLimit?: number | null;
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

  generateAiQuestions(data: {
    courseId: string;
    unitId?: string;
    topic: string;
    context?: string;
    count: number;
    questionType: PracticeQuestionType;
    skillTags?: string[];
  }) {
    return api.post('/practice/generate-ai', data).then((r) => r.data as AiQuestionGenerationJob);
  },

  createAiGeneration(data: {
    courseId: string;
    unitId?: string;
    topic: string;
    context?: string;
    count: number;
    questionType: PracticeQuestionType;
    skillTags?: string[];
    sourceReason?: string;
  }) {
    return api
      .post('/practice/ai-generations', data)
      .then((r) => r.data as AiQuestionGenerationJob);
  },

  getAiGenerations(params?: {
    status?: AiGenerationJobStatus;
    courseId?: string;
    unitId?: string;
    page?: number;
    limit?: number;
  }) {
    return api
      .get('/practice/ai-generations', { params })
      .then((r) => r.data as PaginatedAiGenerationJobs);
  },

  getAiGeneration(id: string) {
    return api.get(`/practice/ai-generations/${id}`).then((r) => r.data as AiQuestionGenerationJob);
  },

  updateAiDraft(
    id: string,
    data: {
      type?: PracticeQuestionType;
      prompt?: string;
      options?: unknown;
      correctAnswer?: unknown;
      explanation?: string | null;
      skillTags?: string[];
      difficulty?: string | null;
    },
  ) {
    return api
      .patch(`/practice/ai-drafts/${id}`, data)
      .then((r) => r.data as AiGeneratedQuestionDraft);
  },

  approveAiDraft(id: string) {
    return api
      .post(`/practice/ai-drafts/${id}/approve`)
      .then((r) => r.data as AiGeneratedQuestionDraft);
  },

  rejectAiDraft(id: string, rejectionReason: string) {
    return api
      .post(`/practice/ai-drafts/${id}/reject`, { rejectionReason })
      .then((r) => r.data as AiGeneratedQuestionDraft);
  },

  bulkApproveAiDrafts(ids: string[]) {
    return api
      .post('/practice/ai-drafts/bulk-approve', { ids })
      .then((r) => r.data as AiBulkApproveResult);
  },

  bulkRejectAiDrafts(ids: string[], rejectionReason: string) {
    return api
      .post('/practice/ai-drafts/bulk-reject', { ids, rejectionReason })
      .then((r) => r.data as AiBulkRejectResult);
  },

  getReviewQueue(params?: { courseId?: string; unitId?: string }) {
    return api.get('/practice/review-queue', { params }).then((r) => r.data as PracticeQuestion[]);
  },

  approveQuestion(id: string) {
    return api.post(`/practice/review-queue/${id}/approve`).then((r) => r.data);
  },

  rejectQuestion(id: string) {
    return api.post(`/practice/review-queue/${id}/reject`).then((r) => r.data);
  },

  bulkApproveQuestions(ids: string[]) {
    return api.post('/practice/review-queue/bulk-approve', { ids }).then((r) => r.data);
  },

  bulkRejectQuestions(ids: string[]) {
    return api.post('/practice/review-queue/bulk-reject', { ids }).then((r) => r.data);
  },
};
