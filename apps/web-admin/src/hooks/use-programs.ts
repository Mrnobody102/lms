import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export interface Level {
  id: string;
  title: string;
  description: string | null;
  order: number;
  isActive: boolean;
  programId: string;
  _count?: {
    courses: number;
  };
}

export interface Program {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  isActive: boolean;
  _count?: {
    levels: number;
  };
  levels?: Level[];
}

export function usePrograms() {
  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const response = await api.get('/programs');
      return response.data as Program[];
    },
  });
}

export function useProgram(id: string) {
  return useQuery({
    queryKey: ['programs', id],
    queryFn: async () => {
      const response = await api.get(`/programs/${id}`);
      return response.data as Program;
    },
    enabled: !!id,
  });
}

export function useCreateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Program>) => {
      const response = await api.post('/programs', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useUpdateProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Program> }) => {
      const response = await api.patch(`/programs/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', variables.id] });
    },
  });
}

export function useDeleteProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/programs/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });
}

export function useCreateLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, data }: { programId: string; data: Partial<Level> }) => {
      const response = await api.post(`/programs/${programId}/levels`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', variables.programId] });
    },
  });
}

export function useUpdateLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      programId,
      levelId,
      data,
    }: {
      programId: string;
      levelId: string;
      data: Partial<Level>;
    }) => {
      const response = await api.patch(`/programs/${programId}/levels/${levelId}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', variables.programId] });
    },
  });
}

export function useDeleteLevel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ programId, levelId }: { programId: string; levelId: string }) => {
      const response = await api.delete(`/programs/${programId}/levels/${levelId}`);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      queryClient.invalidateQueries({ queryKey: ['programs', variables.programId] });
    },
  });
}
