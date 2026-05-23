import { useQuery } from '@tanstack/react-query';
import { skillApi } from '@/lib/skill-api';

export function useSkills(enabled = true) {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => skillApi.listSkills(),
    enabled,
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

export function useSkillMasteryTrend(days = 30) {
  return useQuery({
    queryKey: ['skill-mastery-trend', days],
    queryFn: () => skillApi.getMasteryTrend(days),
    staleTime: 60 * 1000,
  });
}
