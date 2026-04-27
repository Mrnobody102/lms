import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { practiceApi } from '@/lib/practice-api';

export function usePracticeExerciseSets(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['practice-exercise-sets', params],
    queryFn: () => practiceApi.getExerciseSets(params),
    staleTime: 60 * 1000,
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

export function usePracticeAttempts(params?: {
  courseId?: string;
  exerciseSetId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['practice-attempts', params],
    queryFn: () => practiceApi.getAttempts(params),
    staleTime: 30 * 1000,
  });
}

export function usePracticeAttempt(id: string) {
  return useQuery({
    queryKey: ['practice-attempt', id],
    queryFn: () => practiceApi.getAttempt(id),
    enabled: Boolean(id),
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
