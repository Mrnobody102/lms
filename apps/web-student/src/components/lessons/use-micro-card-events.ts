import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type MicroCardEventType =
  | 'MICRO_CARD_VIEWED'
  | 'MICRO_CARD_FLIPPED'
  | 'MICRO_CARD_COMPLETED';

export function useTrackMicroCardEvent(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { cardKey: string; eventType: MicroCardEventType; durationMs?: number }) =>
      api.post(`/lessons/${lessonId}/micro-card-events`, data).then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
      queryClient.invalidateQueries({ queryKey: ['course-progress'] });
    },
  });
}

export function useAddMicroCardToReview(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardKey: string) =>
      api
        .post(`/lessons/${lessonId}/micro-cards/${encodeURIComponent(cardKey)}/add-to-review`)
        .then((response) => response.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['srs-queue'] });
      queryClient.invalidateQueries({ queryKey: ['progress-summary'] });
    },
  });
}
