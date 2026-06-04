import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  srsApi,
  type CustomCardPayload,
  type ReviewCardGrade,
  type ReviewQueueParams,
} from '../lib/srs-api';

export const srsKeys = {
  all: ['srs'] as const,
  queue: (params?: ReviewQueueParams) => [...srsKeys.all, 'queue', params ?? {}] as const,
  summary: () => [...srsKeys.all, 'summary'] as const,
  stats: (days: number) => [...srsKeys.all, 'stats', { days }] as const,
  customCards: () => [...srsKeys.all, 'customCards'] as const,
};

export function useReviewQueue(params?: string | ReviewQueueParams, enabled = true) {
  const queryParams = typeof params === 'string' ? { skill: params || undefined } : params;
  return useQuery({
    queryKey: srsKeys.queue(queryParams),
    queryFn: () => srsApi.getQueue(queryParams),
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
      // Refresh the due/summary counters and stats so dashboards reflect the
      // graded card immediately. Prefix keys cover every params variant.
      queryClient.invalidateQueries({ queryKey: [...srsKeys.all, 'summary'] });
      queryClient.invalidateQueries({ queryKey: [...srsKeys.all, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
      // Mark the review queue stale WITHOUT refetching the active session.
      // The review page advances its local session queue itself; refetching
      // here would overwrite that local state mid-session and cause the card
      // list to flicker/reset. The queue refetches cleanly on next mount.
      queryClient.invalidateQueries({ queryKey: [...srsKeys.all, 'queue'], refetchType: 'none' });
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
