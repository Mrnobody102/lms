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

export type ExamStatusFilter = 'all' | 'published' | 'draft';

export interface ExamListParams {
  courseId?: string;
  unitId?: string;
  search?: string;
  status?: ExamStatusFilter;
  page?: number;
  limit?: number;
}

export interface PaginatedExams {
  data: ExamSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const examApi = {
  getExams(params?: ExamListParams) {
    return examApi.getExamsPage({ limit: 100, ...params }).then((response) => response.data);
  },

  getExamsPage(params?: ExamListParams) {
    return api
      .get('/exams', { params })
      .then((response) => normalizePaginatedExams(response.data, params));
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

function normalizePaginatedExams(value: unknown, params?: ExamListParams): PaginatedExams {
  if (isPaginatedExams(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return {
      data: value as ExamSummary[],
      meta: createPaginationMeta(params, value.length),
    };
  }

  return {
    data: [],
    meta: createPaginationMeta(params, 0),
  };
}

function isPaginatedExams(value: unknown): value is PaginatedExams {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const meta = record.meta;
  return (
    Array.isArray(record.data) &&
    !!meta &&
    typeof meta === 'object' &&
    typeof (meta as Record<string, unknown>).page === 'number' &&
    typeof (meta as Record<string, unknown>).limit === 'number' &&
    typeof (meta as Record<string, unknown>).total === 'number' &&
    typeof (meta as Record<string, unknown>).totalPages === 'number'
  );
}

function createPaginationMeta(params: ExamListParams | undefined, total: number) {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? Math.max(total, 1);

  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
