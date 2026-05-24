import api from './api';

export interface ReportFilters {
  cohortId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CourseReportFilters extends ReportFilters {
  courseId?: string;
  programId?: string;
}

export interface TrendReportFilters extends CourseReportFilters {
  days?: number;
  cohortIds?: string[];
}

export type RiskFlagType =
  | 'NO_ACTIVITY'
  | 'FALLING_BEHIND'
  | 'LOW_MASTERY'
  | 'OVERDUE_SRS'
  | 'DECLINING_SCORE';
export type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProgramRollupRow {
  id: string;
  title: string;
  levelCount: number;
  courseCount: number;
  enrollmentCount: number;
  lessonCount: number;
  completionRate: number;
  practiceAccuracy: number;
  examAccuracy: number;
}

export interface UnassignedRollupRow {
  id: null;
  title: string;
  levelCount: 0;
  courseCount: number;
  enrollmentCount: number;
  lessonCount: number;
  completionRate: number;
  practiceAccuracy: number;
  examAccuracy: number;
}

export interface ProgramsRollupResponse {
  programs: ProgramRollupRow[];
  unassigned: UnassignedRollupRow | null;
}

export interface LevelRollupRow {
  id: string;
  title: string;
  order: number;
  courseCount: number;
  enrollmentCount: number;
  lessonCount: number;
  completionRate: number;
  practiceAccuracy: number;
  examAccuracy: number;
}

export interface ProgramDetailResponse {
  program: { id: string; title: string; description: string | null };
  levels: LevelRollupRow[];
}

export interface CourseRollupRow {
  courseId: string;
  title: string;
  enrollmentCount: number;
  lessonCount: number;
  completionRate: number;
  practiceAccuracy: number;
  examAccuracy: number;
}

export interface LevelDetailResponse {
  level: { id: string; title: string; order: number };
  program: { id: string; title: string };
  courses: CourseRollupRow[];
}

export interface UnitRollupRow {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
  accuracy: number;
  totalQuestions: number;
}

export interface CourseUnitsResponse {
  course: { id: string; title: string };
  units: UnitRollupRow[];
}

export interface CourseStudentRow {
  userId: string;
  fullName: string;
  email: string;
  isActive: boolean;
  enrolledAt: string;
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  practiceAccuracy: number;
  practiceAttempts: number;
  examAccuracy: number;
  examAttempts: number;
  lastActivityAt: string | null;
  riskFlags: ('NO_ACTIVITY' | 'FALLING_BEHIND' | 'LOW_MASTERY')[];
}

export interface CourseStudentsResponse {
  course: { id: string; title: string };
  students: CourseStudentRow[];
}

export interface RiskFlagRow {
  userId: string;
  fullName: string;
  email: string;
  courseId: string;
  courseTitle: string;
  cohortIds: string[];
  severity: RiskSeverity;
  score: number;
  flags: RiskFlagType[];
  reasons: Array<{ flag: RiskFlagType; message: string; value?: number; threshold?: number }>;
  computedAt: string;
}

export interface RiskFlagsResponse {
  data: RiskFlagRow[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface CohortComparisonRow {
  cohortId: string;
  cohortName: string;
  learnerCount: number;
  completionRate: number;
  activitySessions: number;
  practiceAccuracy: number;
  examAccuracy: number;
  mastery: number;
  overdueSrsCards: number;
  rank: number;
  deltaCompletion: number;
}

export interface CohortComparisonResponse {
  data: CohortComparisonRow[];
  filters: {
    courseId?: string;
    cohortIds?: string[];
    startDate?: string;
    endDate?: string;
  };
}

export interface SkillAccuracyRow {
  skill: string;
  accuracy: number;
  totalQuestions: number;
}

export interface UnitAccuracyRow {
  id: string;
  title: string;
  accuracy: number;
  totalQuestions: number;
}

export interface SkillsAccuracyResponse {
  accuracyByUnit: UnitAccuracyRow[];
  accuracyBySkill: SkillAccuracyRow[];
  filters: CourseReportFilters;
}

export const reportsApi = {
  getPrograms(filters: ReportFilters = {}) {
    return api
      .get('/admin/reports/programs', { params: filters })
      .then((r) => r.data as ProgramsRollupResponse);
  },
  getProgram(programId: string, filters: ReportFilters = {}) {
    return api
      .get(`/admin/reports/programs/${programId}`, { params: filters })
      .then((r) => r.data as ProgramDetailResponse);
  },
  getLevel(levelId: string, filters: ReportFilters = {}) {
    return api
      .get(`/admin/reports/levels/${levelId}`, { params: filters })
      .then((r) => r.data as LevelDetailResponse);
  },
  getCourseUnits(courseId: string, filters: ReportFilters = {}) {
    return api
      .get(`/admin/reports/courses/${courseId}/units`, { params: filters })
      .then((r) => r.data as CourseUnitsResponse);
  },
  getCourseStudents(courseId: string, filters: ReportFilters = {}) {
    return api
      .get(`/admin/reports/courses/${courseId}/students`, { params: filters })
      .then((r) => r.data as CourseStudentsResponse);
  },
  getSkills(filters: CourseReportFilters = {}) {
    return api
      .get('/admin/reports/skills', { params: filters })
      .then((r) => r.data as SkillsAccuracyResponse);
  },

  getRiskFlags(
    filters: {
      courseId?: string;
      cohortId?: string;
      severity?: RiskSeverity;
      flag?: RiskFlagType;
      page?: number;
      limit?: number;
    } = {},
  ) {
    return api
      .get('/admin/reports/risk-flags', { params: filters })
      .then((r) => r.data as RiskFlagsResponse);
  },

  recomputeRiskFlags(filters: { courseId?: string; cohortId?: string } = {}) {
    return api
      .post('/admin/reports/risk-flags/recompute', null, { params: filters })
      .then((r) => r.data as { computed: number });
  },

  getCohortComparison(
    filters: {
      courseId?: string;
      cohortIds?: string[];
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    return api
      .get('/admin/reports/cohort-comparison', { params: filters })
      .then((r) => r.data as CohortComparisonResponse);
  },

  getActivityTrend(filters: TrendReportFilters = {}) {
    return api.get('/admin/reports/activity-trend', { params: filters }).then(
      (r) =>
        r.data as {
          series: Array<{
            cohortId: string;
            cohortName: string;
            trend: Array<{ date: string; opened: number; completed: number }>;
          }>;
        },
    );
  },

  getMasteryTrend(filters: TrendReportFilters = {}) {
    return api.get('/admin/reports/mastery-trend', { params: filters }).then(
      (r) =>
        r.data as {
          series: Array<{
            cohortId: string;
            cohortName: string;
            trend: Array<Record<string, string | number>>;
          }>;
        },
    );
  },

  /**
   * Trigger an authenticated CSV download. Uses the same axios client so cookies/CSRF flow.
   */
  async downloadCsv(path: string, filename: string) {
    const response = await api.get(path, { responseType: 'blob' });
    const blob = response.data as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
