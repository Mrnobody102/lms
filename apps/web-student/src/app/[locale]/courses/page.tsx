'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Map as MapIcon,
  Search,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '../../../components/layout/student-nav';
import { useAuthStore } from '../../../features/auth/auth.store';
import { useCourses } from '../../../hooks/use-courses';
import { useProgressSummary } from '../../../hooks/use-progress';
import {
  getCourseProgressHref,
  getCourseProgressState,
  type CourseProgressState,
} from '../../../lib/course-progress-utils';
import { Link } from '../../../navigation';

type StatusFilter = 'all' | CourseProgressState;

export default function CoursesPage() {
  const t = useTranslations('Student');
  const { isAuthenticated } = useAuthStore();
  const { data: courses = [], isLoading, isError } = useCourses();
  const { data: progressSummary, isLoading: isProgressLoading } =
    useProgressSummary(isAuthenticated);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const progressByCourseId = useMemo(() => {
    return new Map(
      (progressSummary?.courses ?? []).map((courseProgress) => [
        courseProgress.course.id,
        courseProgress,
      ]),
    );
  }, [progressSummary?.courses]);
  const filters = useMemo(
    () => [
      { key: 'all' as const, label: t('courses.filterAll') },
      { key: 'inProgress' as const, label: t('courses.filterInProgress') },
      { key: 'completed' as const, label: t('courses.filterCompleted') },
      { key: 'notStarted' as const, label: t('courses.filterNotStarted') },
    ],
    [t],
  );
  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const progress = progressByCourseId.get(course.id);
      const state = progress ? getCourseProgressState(progress) : 'notStarted';
      const matchesFilter = filter === 'all' || state === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.description?.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [courses, filter, progressByCourseId, query]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">{t('courses.title')}</h1>
            <p className="max-w-2xl text-base text-muted-foreground">{t('courses.subtitle')}</p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('courses.searchPlaceholder')}
              className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </header>

        {isLoading || (isAuthenticated && isProgressLoading) ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-24 opacity-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">{t('courses.loading')}</p>
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {t('courses.loadError')}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{t('courses.empty')}</h3>
            <p className="text-sm text-muted-foreground">{t('courses.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <CourseMetric
                icon={BookOpen}
                label={t('courses.availableCourses')}
                value={t('courses.availableCoursesValue', { count: courses.length })}
              />
              <CourseMetric
                icon={GraduationCap}
                label={t('dashboard.enrolledCourses')}
                value={progressSummary?.totals.courses ?? 0}
              />
              <CourseMetric
                icon={CheckCircle2}
                label={t('dashboard.completedLessons')}
                value={progressSummary?.totals.completedLessons ?? 0}
              />
              <CourseMetric
                icon={BarChart3}
                label={t('dashboard.overallProgress')}
                value={`${progressSummary?.totals.completionPercentage ?? 0}%`}
              />
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFilter(item.key)}
                    className={`h-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                      filter === item.key
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {filteredCourses.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center">
                  <h2 className="text-lg font-semibold">{t('courses.noFilteredTitle')}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('courses.noFilteredDesc')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCourses.map((course) => {
                    const progress = progressByCourseId.get(course.id);
                    const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;
                    const totalDuration =
                      course.totalDuration ??
                      (course.lessons?.reduce(
                        (acc: number, lesson: { duration?: number }) =>
                          acc + (lesson.duration || 0),
                        0,
                      ) ||
                        0);
                    const firstLessonId = course.lessons?.[0]?.id;
                    const state = progress ? getCourseProgressState(progress) : 'notStarted';
                    const completedLessons = progress?.completedLessons ?? 0;
                    const totalLessons = progress?.totalLessons ?? lessonCount;
                    const completionPercentage = progress?.completionPercentage ?? 0;
                    const canOpen = Boolean(
                      firstLessonId || progress?.continueLesson || progress?.lastAccessedLesson,
                    );
                    const href = progress
                      ? getCourseProgressHref(progress, firstLessonId)
                      : firstLessonId
                        ? `/lessons/${firstLessonId}`
                        : '/courses';

                    return (
                      <article
                        key={course.id}
                        className="group flex min-h-[300px] flex-col overflow-hidden rounded-md border bg-card transition-all hover:border-primary/30 hover:shadow-md"
                      >
                        <div className="flex flex-1 flex-col p-6">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                              <GraduationCap className="h-5 w-5" />
                            </div>
                            <CourseStatusBadge state={state} />
                          </div>

                          <h3 className="line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary">
                            {course.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {course.description || t('courses.noDescription')}
                          </p>

                          <div className="mt-5 flex flex-wrap gap-3">
                            <CourseMeta
                              icon={BookOpen}
                              value={t('courses.lessonsCount', { count: lessonCount })}
                            />
                            <CourseMeta
                              icon={MapIcon}
                              value={t('courses.duration', { minutes: totalDuration })}
                            />
                            {progress && (
                              <CourseMeta
                                icon={Clock3}
                                value={t('dashboard.sessionValue', {
                                  count: progress.activitySessions,
                                })}
                              />
                            )}
                          </div>

                          <div className="mt-5">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                              <span>
                                {t('courses.completedCount', {
                                  completed: completedLessons,
                                  total: totalLessons,
                                })}
                              </span>
                              <span className="font-semibold text-foreground">
                                {completionPercentage}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${completionPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-2 px-6 pb-6 sm:grid-cols-2">
                          <Link
                            href={`/courses/${course.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-md border px-5 py-3 text-sm font-medium transition-all hover:bg-muted active:scale-[0.98]"
                          >
                            {t('courses.viewDetail')}
                          </Link>
                          {canOpen ? (
                            <Link
                              href={href}
                              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
                            >
                              {state === 'completed'
                                ? t('courses.reviewCourse')
                                : state === 'inProgress'
                                  ? t('courses.continueCourse')
                                  : t('courses.startNow')}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span className="flex w-full items-center justify-center rounded-md border px-5 py-3 text-sm font-medium text-muted-foreground">
                              {t('courses.noLessons')}
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function CourseMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <article className="rounded-md border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </article>
  );
}

function CourseMeta({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}

function CourseStatusBadge({ state }: { state: CourseProgressState }) {
  const t = useTranslations('Student');
  const className =
    state === 'completed'
      ? 'bg-emerald-500/10 text-emerald-600'
      : state === 'inProgress'
        ? 'bg-primary/10 text-primary'
        : 'bg-muted text-muted-foreground';
  const label =
    state === 'completed'
      ? t('courses.courseStatusCompleted')
      : state === 'inProgress'
        ? t('courses.courseStatusInProgress')
        : t('courses.courseStatusNotStarted');

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>
  );
}
