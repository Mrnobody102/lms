import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { srsApi, type ReviewCardGrade } from '../lib/srs-api';

export const srsKeys = {
  all: ['srs'] as const,
  queue: (skill?: string) => [...srsKeys.all, 'queue', { skill }] as const,
  summary: () => [...srsKeys.all, 'summary'] as const,
};

export function useReviewQueue(skill?: string) {
  return useQuery({
    queryKey: srsKeys.queue(skill),
    queryFn: () => srsApi.getQueue({ skill }),
  });
}

export function useSrsSummary() {
  return useQuery({
    queryKey: srsKeys.summary(),
    queryFn: () => srsApi.getSummary(),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: ReviewCardGrade }) =>
      srsApi.submitReview(cardId, grade),
    onSuccess: () => {
      // Invalidate both SRS queries and progress summary (since it contains srsDue)
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
    },
  });
}
