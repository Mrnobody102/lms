import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateSkillInput, UpdateSkillInput, skillApi } from '@/lib/skill-api';

export function useSkills(includeInactive = false) {
  return useQuery({
    queryKey: ['skills', { includeInactive }],
    queryFn: () => skillApi.listSkills(includeInactive),
    staleTime: 60 * 1000,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSkillInput) => skillApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSkillInput }) =>
      skillApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => skillApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}
