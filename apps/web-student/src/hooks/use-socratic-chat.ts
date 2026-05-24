import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface SocraticChatParams {
  questionPrompt: string;
  studentAnswer?: unknown;
  correctAnswer?: unknown;
  messages: ChatMessage[];
}

export interface SocraticChatResponse {
  role: ChatMessageRole;
  content: string;
}

export function useSocraticChat() {
  return useMutation({
    mutationFn: async (params: SocraticChatParams) => {
      const { data } = await api.post<SocraticChatResponse>('/ai/socratic-chat', params);
      return data;
    },
  });
}
