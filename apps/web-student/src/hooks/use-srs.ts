import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { srsApi, type CustomCardPayload, type ReviewCardGrade } from '../lib/srs-api';

export const srsKeys = {
  all: ['srs'] as const,
  queue: (skill?: string) => [...srsKeys.all, 'queue', { skill }] as const,
  summary: () => [...srsKeys.all, 'summary'] as const,
  stats: (days: number) => [...srsKeys.all, 'stats', { days }] as const,
  customCards: () => [...srsKeys.all, 'customCards'] as const,
};

export function useReviewQueue(skill?: string, enabled = true) {
  return useQuery({
    queryKey: srsKeys.queue(skill),
    queryFn: () => srsApi.getQueue({ skill }),
    enabled,
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
    mutationFn: ({
      cardId,
      grade,
      durationMs,
    }: {
      cardId: string;
      grade: ReviewCardGrade;
      durationMs?: number;
    }) => srsApi.submitReview(cardId, grade, durationMs),
    onSuccess: () => {
      // Invalidate both SRS queries and progress summary (since it contains srsDue)
      queryClient.invalidateQueries({ queryKey: srsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
    },
  });
}

export function useSrsStats(days: number = 30, enabled = true) {
  return useQuery({
    queryKey: srsKeys.stats(days),
    queryFn: () => srsApi.getStats(days),
    enabled,
  });
}

export function useCustomCards(enabled = true) {
  return useQuery({
    queryKey: srsKeys.customCards(),
    queryFn: () => srsApi.getCustomCards(),
    enabled,
  });
}

export function useCreateCustomCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CustomCardPayload) => srsApi.createCustomCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: srsKeys.customCards() });
      queryClient.invalidateQueries({ queryKey: srsKeys.summary() });
    },
  });
}

export function useUpdateCustomCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, data }: { cardId: string; data: CustomCardPayload }) =>
      srsApi.updateCustomCard(cardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: srsKeys.customCards() });
    },
  });
}

export function useDeleteCustomCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => srsApi.deleteCustomCard(cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: srsKeys.customCards() });
      queryClient.invalidateQueries({ queryKey: srsKeys.summary() });
    },
  });
}
