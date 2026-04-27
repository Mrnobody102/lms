import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { examApi } from '@/lib/exam-api';

export function useExams(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => examApi.getExams(params),
    staleTime: 60 * 1000,
  });
}

export function useExam(id: string) {
  return useQuery({
    queryKey: ['exam', id],
    queryFn: () => examApi.getExam(id),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
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
    },
  });
}
