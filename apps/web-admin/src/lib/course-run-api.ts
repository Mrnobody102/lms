import api from './api';

export type CourseRunStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ENROLLING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CourseRunSummary {
  id: string;
  title: string;
  code?: string | null;
  status: CourseRunStatus;
  capacity: number;
  startsAt?: string | null;
  endsAt?: string | null;
  timezone: string;
  deliveryMode: string;
  location?: string | null;
  onlineMeetingUrl?: string | null;
  course: {
    id: string;
    title: string;
    languageCode?: string | null;
    proficiencyLevel?: string | null;
  };
  cohort?: { id: string; name: string } | null;
  instructor: { id: string; fullName: string; email: string; avatarUrl?: string | null };
  _count?: { enrollments: number; sessions: number };
}

export const courseRunApi = {
  list() {
    return api.get('/course-runs').then((response) => response.data as CourseRunSummary[]);
  },
};
