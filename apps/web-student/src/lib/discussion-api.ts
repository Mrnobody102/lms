import api from './api';

export type DiscussionTargetType = 'LESSON' | 'PRACTICE_EXERCISE_SET';

export interface DiscussionAuthor {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
}

export interface DiscussionReply {
  id: string;
  content: string;
  createdAt: string;
  author: DiscussionAuthor;
}

export interface DiscussionThread {
  id: string;
  title?: string | null;
  content: string;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  replies: DiscussionReply[];
  _count?: { replies: number };
}

export interface DiscussionThreadPage {
  data: DiscussionThread[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const discussionApi = {
  getThreads(params: {
    targetType: DiscussionTargetType;
    lessonId?: string;
    exerciseSetId?: string;
    page?: number;
    limit?: number;
  }) {
    return api
      .get('/discussions', { params })
      .then((response) => response.data as DiscussionThreadPage);
  },

  createThread(input: {
    targetType: DiscussionTargetType;
    lessonId?: string;
    exerciseSetId?: string;
    title?: string;
    content: string;
  }) {
    return api.post('/discussions', input).then((response) => response.data as DiscussionThread);
  },

  createReply(threadId: string, content: string) {
    return api
      .post(`/discussions/${threadId}/replies`, { content })
      .then((response) => response.data as DiscussionReply);
  },

  resolveThread(threadId: string) {
    return api
      .patch(`/discussions/${threadId}/resolve`)
      .then((response) => response.data as DiscussionThread);
  },
};
