import { useQuery } from '@tanstack/react-query';
import { skillApi } from '@/lib/skill-api';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.listSkills(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillMastery() {
  return useQuery({
    queryKey: ['skill-mastery'],
    queryFn: () => skillApi.getMastery(),
    staleTime: 30 * 1000,
  });
}
