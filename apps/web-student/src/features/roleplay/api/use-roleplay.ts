import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultApiClient } from '@repo/api-client';

export interface RoleplayMessage {
  id: string;
  role: 'USER' | 'AI' | 'SYSTEM';
  content: string;
  createdAt: string;
}

export interface RoleplaySession {
  id: string;
  scenario: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  feedback?: {
    grammar: string;
    vocabulary: string;
    overall: string;
  };
  messages: RoleplayMessage[];
  startedAt: string;
  completedAt?: string;
}

export const useCreateRoleplaySession = () => {
  return useMutation({
    mutationFn: async (scenario: string) => {
      const response = await defaultApiClient.post('/roleplay/sessions', { scenario });
      return response.data as RoleplaySession;
    },
  });
};

export const useGetRoleplaySessions = () => {
  return useQuery({
    queryKey: ['roleplaySessions'],
    queryFn: async () => {
      const response = await defaultApiClient.get('/roleplay/sessions');
      return response.data as RoleplaySession[];
    },
  });
};

export const useGetRoleplaySession = (id: string) => {
  return useQuery({
    queryKey: ['roleplaySession', id],
    queryFn: async () => {
      const response = await defaultApiClient.get(`/roleplay/sessions/${id}`);
      return response.data as RoleplaySession;
    },
    enabled: !!id,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await defaultApiClient.post(`/roleplay/sessions/${id}/messages`, {
        content,
      });
      return response.data as RoleplaySession;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['roleplaySession', variables.id], data);
    },
  });
};

export const useCompleteRoleplaySession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await defaultApiClient.post(`/roleplay/sessions/${id}/complete`);
      return response.data as RoleplaySession;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['roleplaySession', variables], data);
    },
  });
};
