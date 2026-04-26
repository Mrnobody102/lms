import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressApi, ProgressStatus } from '@/lib/progress-api';

export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => progressApi.getCourseProgress(courseId),
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: ProgressStatus }) =>
      progressApi.updateProgress(lessonId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
    },
  });
}

export function useProgressSummary(enabled = true) {
  return useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => progressApi.getSummary(),
    enabled,
    staleTime: 60 * 1000,
  });
}
