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
    }) => practiceApi.createQuestion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-questions'] });
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
