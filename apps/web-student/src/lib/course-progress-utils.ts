import type { CourseProgressSummary } from './progress-api';

export type CourseProgressState = 'notStarted' | 'inProgress' | 'completed';

export function getCourseProgressState(course: CourseProgressSummary): CourseProgressState {
  if (
    course.completionPercentage >= 100 ||
    (course.totalLessons > 0 && course.completedLessons >= course.totalLessons)
  ) {
    return 'completed';
  }

  if (course.completedLessons > 0 || course.activitySessions > 0 || course.lastActivityAt) {
    return 'inProgress';
  }

  return 'notStarted';
}

export function getCourseProgressHref(course: CourseProgressSummary, fallbackLessonId?: string) {
  const lessonId = course.continueLesson?.id ?? course.lastAccessedLesson?.id ?? fallbackLessonId;
  return lessonId ? `/lessons/${lessonId}` : '/courses';
}

export function compareCourseProgressByActivity(
  first: CourseProgressSummary,
  second: CourseProgressSummary,
) {
  return getActivityTime(second) - getActivityTime(first);
}

function getActivityTime(course: CourseProgressSummary) {
  return course.lastActivityAt ? new Date(course.lastActivityAt).getTime() : 0;
}
