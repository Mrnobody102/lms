import { DEFAULT_DEMO_TENANT_ID } from '@repo/shared';

const LOCAL_STUDENT_PORTAL_URL = 'http://localhost:3100';

export interface PublicLessonPreview {
  id: string;
  title: string;
  type: string;
  duration: number;
  order: number;
}

export interface PublicCourseUnitPreview {
  id: string;
  title: string;
  description: string | null;
  order: number;
  lessons: PublicLessonPreview[];
}

export interface PublicCourseSummary {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  coverImageUrl: string | null;
  languageCode?: string | null;
  proficiencyLevel?: string | null;
  totalDuration: number;
  level: {
    id: string;
    title: string;
    program: {
      id: string;
      title: string;
    } | null;
  } | null;
  lessonCount: number;
  unitCount: number;
}

export interface PublicCourseDetail extends PublicCourseSummary {
  units: PublicCourseUnitPreview[];
  ungroupedLessons: PublicLessonPreview[];
}

export interface PublicCourseListResponse {
  data: PublicCourseSummary[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PublicCourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  languageCode?: string;
  proficiencyLevel?: string;
  programId?: string;
}

export async function getPublicCourses(params?: PublicCourseListParams) {
  return requestPublic<PublicCourseListResponse>('/public/courses', params);
}

export async function getPublicCourse(courseId: string) {
  return requestPublic<PublicCourseDetail>(`/public/courses/${courseId}`);
}

export function getStudentPortalUrl(path: string, locale: string) {
  const baseUrl = getStudentPortalBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}/${locale}${normalizedPath}`;
}

function getStudentPortalBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WEB_STUDENT_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Missing NEXT_PUBLIC_WEB_STUDENT_URL environment variable. Cross-portal links will be broken.',
    );
  }

  return LOCAL_STUDENT_PORTAL_URL;
}

export function getCourseLevelLabel(course: PublicCourseSummary) {
  const program = course.level?.program?.title;
  const level = course.level?.title;

  if (program && level) {
    return `${program} / ${level}`;
  }

  return level ?? program ?? null;
}

async function requestPublic<T>(path: string, params?: PublicCourseListParams): Promise<T> {
  const urlParams = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      urlParams.set(key, String(value));
    }
  });

  const query = urlParams.toString();
  const response = await fetch(`${getPublicApiBaseUrl()}${path}${query ? `?${query}` : ''}`, {
    credentials: 'include',
    headers: buildPublicHeaders(),
  });

  const body = (await response.json()) as unknown;

  if (!response.ok) {
    throw new Error(extractErrorMessage(body));
  }

  if (isSuccessEnvelope<T>(body)) {
    return body.data;
  }

  return body as T;
}

function buildPublicHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const tenantId =
    process.env.NEXT_PUBLIC_TENANT_ID?.trim() ||
    (process.env.NODE_ENV === 'production' ? undefined : DEFAULT_DEMO_TENANT_ID);

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  return headers;
}

function getPublicApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  return apiUrl ? buildApiBaseUrl(apiUrl) : '/api';
}

function buildApiBaseUrl(baseUrl: string) {
  const normalized = baseUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/i, '');
  return `${normalized}/api`;
}

function isSuccessEnvelope<T>(value: unknown): value is { success: true; data: T } {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).success === true &&
    'data' in value
  );
}

function extractErrorMessage(value: unknown) {
  if (!!value && typeof value === 'object') {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === 'string') {
      return message;
    }
  }

  return 'Could not load public course catalog';
}
