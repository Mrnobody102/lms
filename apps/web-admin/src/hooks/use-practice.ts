import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi, PracticeQuestionType } from '@/lib/practice-api';

export function usePracticeQuestions(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['practice-questions', params],
    queryFn: () => practiceApi.getQuestions(params),
    enabled: Boolean(params?.courseId),
    staleTime: 60 * 1000,
  });
}

export function useCreatePracticeQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
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
    }) => practiceApi.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
    },
  });
}

export function useUpdatePracticeQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      payload: {
        unitId?: string | null;
        type?: PracticeQuestionType;
        prompt?: string;
        options?: unknown;
        correctAnswer?: unknown;
        explanation?: string | null;
        skillTags?: string[];
        audioMediaAssetId?: string | null;
        audioReplayLimit?: number | null;
      };
    }) => practiceApi.updateQuestion(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
    },
  });
}

export function useDeletePracticeQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => practiceApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-set'] });
    },
  });
}

export function usePracticeExerciseSets(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['practice-exercise-sets', params],
    queryFn: () => practiceApi.getExerciseSets(params),
    enabled: Boolean(params?.courseId),
    staleTime: 60 * 1000,
  });
}

export function useCreatePracticeExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      courseId: string;
      unitId?: string;
      title: string;
      description?: string;
      isPublished?: boolean;
      questionIds: string[];
    }) => practiceApi.createExerciseSet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
    },
  });
}

export function usePracticeExerciseSet(id: string) {
  return useQuery({
    queryKey: ['practice-exercise-set', id],
    queryFn: () => practiceApi.getExerciseSet(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useUpdatePracticeExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      id: string;
      payload: {
        unitId?: string | null;
        title?: string;
        description?: string | null;
        isPublished?: boolean;
        questionIds?: string[];
      };
    }) => practiceApi.updateExerciseSet(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-set'] });
    },
  });
}

export function useDeletePracticeExerciseSet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => practiceApi.deleteExerciseSet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-set'] });
    },
  });
}

export function useGeneratePracticeQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      courseId: string;
      unitId?: string;
      topic: string;
      context?: string;
      count: number;
      questionType: PracticeQuestionType;
      skillTags?: string[];
    }) => practiceApi.generateAiQuestions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-review-queue'] });
    },
  });
}

export function useReviewQueue(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['practice-review-queue', params],
    queryFn: () => practiceApi.getReviewQueue(params),
    enabled: Boolean(params?.courseId),
    staleTime: 60 * 1000,
  });
}

export function useApprovePracticeQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => practiceApi.approveQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
    },
  });
}

export function useRejectPracticeQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => practiceApi.rejectQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-review-queue'] });
    },
  });
}

export function useBulkApprovePracticeQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => practiceApi.bulkApproveQuestions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-review-queue'] });
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
    },
  });
}

export function useBulkRejectPracticeQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => practiceApi.bulkRejectQuestions(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-review-queue'] });
    },
  });
}
