import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface RoleplayMessage {
  id: string;
  role: 'USER' | 'AI' | 'SYSTEM';
  content: string;
  audioMediaAssetId?: string | null;
  pronunciationAssessments?: PronunciationAssessment[];
  createdAt: string;
}

export type RoleplayMode = 'TEXT' | 'AUDIO' | 'MIXED';

export interface RoleplayScenario {
  id: string;
  courseId: string;
  unitId?: string | null;
  title: string;
  description?: string | null;
  targetLanguage: string;
  level?: string | null;
  skillTags: string[];
  mode: RoleplayMode;
  openingMessage?: string | null;
  course?: { id: string; title: string };
  unit?: { id: string; title: string } | null;
}

export interface PronunciationAssessment {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  messageId: string;
  overallScore?: number | null;
  fluencyScore?: number | null;
  accuracyScore?: number | null;
  completenessScore?: number | null;
  errorMessage?: string | null;
}

export interface RoleplaySession {
  id: string;
  scenario: string;
  scenarioId?: string | null;
  mode: RoleplayMode;
  status: 'IN_PROGRESS' | 'COMPLETED';
  score?: number;
  pronunciationScore?: number | null;
  feedback?: {
    grammar: string;
    vocabulary: string;
    overall: string;
  };
  messages: RoleplayMessage[];
  pronunciationAssessments?: PronunciationAssessment[];
  startedAt: string;
  completedAt?: string;
}

export const useCreateRoleplaySession = () => {
  return useMutation({
    mutationFn: async (data: { scenarioId?: string; scenario?: string; mode?: RoleplayMode }) => {
      const response = await api.post('/roleplay/sessions', data);
      return response.data as RoleplaySession;
    },
  });
};

export const useGetAvailableRoleplayScenarios = (enabled = true) => {
  return useQuery({
    queryKey: ['roleplayScenarios', 'available'],
    queryFn: async () => {
      const response = await api.get('/roleplay/scenarios/available');
      return response.data as { data: RoleplayScenario[] };
    },
    enabled,
  });
};

export const useGetRoleplaySessions = (
  params?: { page?: number; limit?: number },
  enabled = true,
) => {
  return useQuery({
    queryKey: ['roleplaySessions', params],
    queryFn: async () => {
      const response = await api.get('/roleplay/sessions', { params });
      return response.data as { data: RoleplaySession[]; total: number };
    },
    enabled,
  });
};

export const useGetRoleplaySession = (id: string) => {
  return useQuery({
    queryKey: ['roleplaySession', id],
    queryFn: async () => {
      const response = await api.get(`/roleplay/sessions/${id}`);
      return response.data as RoleplaySession;
    },
    enabled: !!id,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await api.post(`/roleplay/sessions/${id}/messages`, {
        content,
      });
      return response.data as RoleplaySession;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['roleplaySession', variables.id], data);
    },
  });
};

export const useSendAudioMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      mediaAssetId,
      expectedText,
      content,
    }: {
      id: string;
      mediaAssetId: string;
      expectedText?: string;
      content?: string;
    }) => {
      const response = await api.post(`/roleplay/sessions/${id}/messages/audio`, {
        mediaAssetId,
        expectedText,
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
      const response = await api.post(`/roleplay/sessions/${id}/complete`);
      return response.data as RoleplaySession;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['roleplaySession', variables], data);
    },
  });
};
