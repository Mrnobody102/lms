import { useQuery } from '@tanstack/react-query';
import {
  reportsApi,
  type CourseReportFilters,
  type ReportFilters,
  type TrendReportFilters,
} from '@/lib/reports-api';

export function useProgramsReport(filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'programs', filters],
    queryFn: () => reportsApi.getPrograms(filters),
  });
}

export function useProgramReport(programId: string, filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'programs', programId, filters],
    queryFn: () => reportsApi.getProgram(programId, filters),
    enabled: Boolean(programId),
  });
}

export function useLevelReport(levelId: string, filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'levels', levelId, filters],
    queryFn: () => reportsApi.getLevel(levelId, filters),
    enabled: Boolean(levelId),
  });
}

export function useCourseUnitsReport(courseId: string, filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'courses', courseId, 'units', filters],
    queryFn: () => reportsApi.getCourseUnits(courseId, filters),
    enabled: Boolean(courseId),
  });
}

export function useCourseStudentsReport(courseId: string, filters: ReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'courses', courseId, 'students', filters],
    queryFn: () => reportsApi.getCourseStudents(courseId, filters),
    enabled: Boolean(courseId),
  });
}

export function useSkillsReport(filters: CourseReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'skills', filters],
    queryFn: () => reportsApi.getSkills(filters),
  });
}

export function useActivityTrend(filters: TrendReportFilters = {}) {
  return useQuery({
    queryKey: ['reports', 'activity-trend', filters],
    queryFn: () => reportsApi.getActivityTrend(filters),
  });
}

export function useMasteryTrend(filters: ReportFilters & { days?: number } = {}) {
  return useQuery({
    queryKey: ['reports', 'mastery-trend', filters],
    queryFn: () => reportsApi.getMasteryTrend(filters),
  });
}
