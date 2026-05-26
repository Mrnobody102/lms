import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examApi } from '@/lib/exam-api';

export function useExams(params?: { courseId?: string; unitId?: string }, enabled = true) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => examApi.getExams(params),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useExam(id: string, enabled = true) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => examApi.getExam(id),
    enabled: enabled && Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useExamAttempts(
  params?: { courseId?: string; examId?: string; limit?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['exam-attempts', params],
    queryFn: () => examApi.getAttempts(params),
    enabled,
    staleTime: 30 * 1000,
  });
}

export function useExamAttempt(id: string, enabled = true) {
  return useQuery({
    queryKey: ['exam-attempt', id],
    queryFn: () => examApi.getAttempt(id),
    enabled: enabled && Boolean(id),
    staleTime: 30 * 1000,
  });
}

export function useStartExamAttempt(id: string) {
  return useMutation({
    mutationFn: () => examApi.startAttempt(id),
  });
}

export function useSubmitExamAttempt(attemptId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (answers: Array<{ questionId: string; answer: unknown }>) => {
      if (!attemptId) {
        throw new Error('Missing exam attempt ID');
      }
      return examApi.submitAttempt(attemptId, answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
    },
  });
}
