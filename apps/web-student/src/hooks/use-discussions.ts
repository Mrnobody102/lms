import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { discussionApi, DiscussionTargetType } from '@/lib/discussion-api';

interface DiscussionTarget {
  targetType: DiscussionTargetType;
  lessonId?: string;
  exerciseSetId?: string;
}

function discussionKey(target: DiscussionTarget) {
  return ['discussions', target] as const;
}

export function useDiscussionThreads(target: DiscussionTarget, enabled = true) {
  return useQuery({
    queryKey: discussionKey(target),
    queryFn: () => discussionApi.getThreads({ ...target, limit: 20 }),
    enabled:
      enabled &&
      ((target.targetType === 'LESSON' && Boolean(target.lessonId)) ||
        (target.targetType === 'PRACTICE_EXERCISE_SET' && Boolean(target.exerciseSetId))),
    staleTime: 30 * 1000,
  });
}

export function useCreateDiscussionThread(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { title?: string; content: string }) =>
      discussionApi.createThread({
        ...target,
        ...input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}

export function useCreateDiscussionReply(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, content }: { threadId: string; content: string }) =>
      discussionApi.createReply(threadId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}

export function useResolveDiscussionThread(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => discussionApi.resolveThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}
