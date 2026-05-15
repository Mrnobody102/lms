import api from './api';

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
}

export interface CourseStudentsResponse {
  course: { id: string; title: string };
  students: CourseStudentRow[];
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
  filters: { courseId?: string; programId?: string };
}

export const reportsApi = {
  getPrograms() {
    return api.get('/admin/reports/programs').then((r) => r.data as ProgramsRollupResponse);
  },
  getProgram(programId: string) {
    return api
      .get(`/admin/reports/programs/${programId}`)
      .then((r) => r.data as ProgramDetailResponse);
  },
  getLevel(levelId: string) {
    return api.get(`/admin/reports/levels/${levelId}`).then((r) => r.data as LevelDetailResponse);
  },
  getCourseUnits(courseId: string) {
    return api
      .get(`/admin/reports/courses/${courseId}/units`)
      .then((r) => r.data as CourseUnitsResponse);
  },
  getCourseStudents(courseId: string) {
    return api
      .get(`/admin/reports/courses/${courseId}/students`)
      .then((r) => r.data as CourseStudentsResponse);
  },
  getSkills(filters: { courseId?: string; programId?: string } = {}) {
    return api
      .get('/admin/reports/skills', { params: filters })
      .then((r) => r.data as SkillsAccuracyResponse);
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
