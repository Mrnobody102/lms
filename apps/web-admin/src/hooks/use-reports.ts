import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/reports-api';

export function useProgramsReport() {
  return useQuery({
    queryKey: ['reports', 'programs'],
    queryFn: () => reportsApi.getPrograms(),
  });
}

export function useProgramReport(programId: string) {
  return useQuery({
    queryKey: ['reports', 'programs', programId],
    queryFn: () => reportsApi.getProgram(programId),
    enabled: Boolean(programId),
  });
}

export function useLevelReport(levelId: string) {
  return useQuery({
    queryKey: ['reports', 'levels', levelId],
    queryFn: () => reportsApi.getLevel(levelId),
    enabled: Boolean(levelId),
  });
}

export function useCourseUnitsReport(courseId: string) {
  return useQuery({
    queryKey: ['reports', 'courses', courseId, 'units'],
    queryFn: () => reportsApi.getCourseUnits(courseId),
    enabled: Boolean(courseId),
  });
}

export function useCourseStudentsReport(courseId: string) {
  return useQuery({
    queryKey: ['reports', 'courses', courseId, 'students'],
    queryFn: () => reportsApi.getCourseStudents(courseId),
    enabled: Boolean(courseId),
  });
}

export function useSkillsReport(filters: { courseId?: string; programId?: string } = {}) {
  return useQuery({
    queryKey: ['reports', 'skills', filters],
    queryFn: () => reportsApi.getSkills(filters),
  });
}
