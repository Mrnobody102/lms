import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '@repo/api-client';

export type RoleplaySessionStatus = 'IN_PROGRESS' | 'COMPLETED';
export type MessageRole = 'USER' | 'AI' | 'SYSTEM';

export interface RoleplayMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface RoleplaySession {
  id: string;
  scenario: string;
  status: RoleplaySessionStatus;
  score: number | null;
  feedback: Record<string, string> | null;
  startedAt: string;
  completedAt: string | null;
  messages: RoleplayMessage[];
}

export interface CreateRoleplaySessionParams {
  scenario: string;
}

export interface SendMessageParams {
  sessionId: string;
  content: string;
}

export function useRoleplaySession(sessionId: string, enabled = true) {
  return useQuery<RoleplaySession>({
    queryKey: ['roleplay', sessionId],
    queryFn: async () => {
      const { data } = await defaultApiClient.get(`/roleplay/sessions/${sessionId}`);
      return data;
    },
    enabled: !!sessionId && enabled,
  });
}

export function useCreateRoleplaySession() {
  return useMutation({
    mutationFn: async (params: CreateRoleplaySessionParams) => {
      const { data } = await defaultApiClient.post<RoleplaySession>('/roleplay/sessions', params);
      return data;
    },
  });
}

export function useSendRoleplayMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, content }: SendMessageParams) => {
      const { data } = await defaultApiClient.post<RoleplaySession>(
        `/roleplay/sessions/${sessionId}/messages`,
        { content },
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['roleplay', data.id], data);
    },
  });
}

export function useCompleteRoleplaySession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await defaultApiClient.post<RoleplaySession>(
        `/roleplay/sessions/${sessionId}/complete`,
      );
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['roleplay', data.id], data);
    },
  });
}
