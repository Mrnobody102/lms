import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi } from '@/lib/practice-api';

export function usePracticeExerciseSets(
  params?: {
    courseId?: string;
    unitId?: string;
    skill?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['practice-exercise-sets', params],
    queryFn: () => practiceApi.getExerciseSets(params),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function usePracticeRecommendations(
  params?: {
    courseId?: string;
    unitId?: string;
    skill?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['practice-recommendations', params],
    queryFn: () => practiceApi.getRecommendations(params),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function usePracticeExerciseSet(id: string, enabled = true) {
  return useQuery({
    queryKey: ['practice-exercise-set', id],
    queryFn: () => practiceApi.getExerciseSet(id),
    enabled: enabled && Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function usePracticeAttempts(
  params?: {
    courseId?: string;
    exerciseSetId?: string;
    limit?: number;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: ['practice-attempts', params],
    queryFn: () => practiceApi.getAttempts(params),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function usePracticeAttempt(id: string, enabled = true) {
  return useQuery({
    queryKey: ['practice-attempt', id],
    queryFn: () => practiceApi.getAttempt(id),
    enabled: enabled && Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useSubmitPracticeAttempt(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: Array<{ questionId: string; answer: unknown }>) =>
      practiceApi.submitAttempt(id, answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['practice-exercise-set', id] });
      queryClient.invalidateQueries({ queryKey: ['practice-attempts'] });
    },
  });
}
