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

export function useUpdateDiscussionThread(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      title,
      content,
    }: {
      threadId: string;
      title?: string;
      content?: string;
    }) => discussionApi.updateThread(threadId, { title, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}

export function useDeleteDiscussionThread(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (threadId: string) => discussionApi.deleteThread(threadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}

export function useUpdateDiscussionReply(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      threadId,
      replyId,
      content,
    }: {
      threadId: string;
      replyId: string;
      content: string;
    }) => discussionApi.updateReply(threadId, replyId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discussionKey(target) });
    },
  });
}

export function useDeleteDiscussionReply(target: DiscussionTarget) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, replyId }: { threadId: string; replyId: string }) =>
      discussionApi.deleteReply(threadId, replyId),
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
