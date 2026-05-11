import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExamQuestionType, examApi } from '@/lib/exam-api';

export function useExams(params?: { courseId?: string; unitId?: string }) {
  return useQuery({
    queryKey: ['exams', params],
    queryFn: () => examApi.getExams(params),
    enabled: Boolean(params?.courseId),
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

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      courseId: string;
      unitId?: string;
      title: string;
      description?: string;
      durationMinutes?: number;
      passingScore?: number;
      isPublished?: boolean;
      sections: Array<{
        title: string;
        questions: Array<{
          type: ExamQuestionType;
          prompt: string;
          options?: unknown;
          correctAnswer: unknown;
          explanation?: string;
          points?: number;
          skillTags?: string[];
        }>;
      }>;
    }) => examApi.createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}
