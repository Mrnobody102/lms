'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import type { CourseProgressSummary } from '@/lib/progress-api';
import {
  compareCourseProgressByActivity,
  getCourseProgressHref,
  getCourseProgressState,
  type CourseProgressState,
} from '@/lib/course-progress-utils';

type CourseFilter = 'all' | CourseProgressState;

export function CourseProgressPlanner({ courses }: { courses: CourseProgressSummary[] }) {
  const t = useTranslations('Student');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CourseFilter>('all');
  const filters = useMemo(
    () => [
      { key: 'all' as const, label: t('dashboard.filterAll') },
      { key: 'inProgress' as const, label: t('dashboard.filterInProgress') },
      { key: 'completed' as const, label: t('dashboard.filterCompleted') },
      { key: 'notStarted' as const, label: t('dashboard.filterNotStarted') },
    ],
    [t],
  );
  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...courses].sort(compareCourseProgressByActivity).filter((course) => {
      const state = getCourseProgressState(course);
      const matchesFilter = filter === 'all' || state === filter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.course.title.toLowerCase().includes(normalizedQuery) ||
        course.continueLesson?.title.toLowerCase().includes(normalizedQuery) ||
        course.lastAccessedLesson?.title.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [courses, filter, query]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('dashboard.courseProgressTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('dashboard.courseProgressDesc')}
          </p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('dashboard.searchPlaceholder')}
            className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>

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
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          {t('dashboard.noFilteredCourses')}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course) => (
            <CourseProgressRow key={course.course.id} course={course} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

function CourseProgressRow({ course, locale }: { course: CourseProgressSummary; locale: string }) {
  const t = useTranslations('Student');
  const state = getCourseProgressState(course);
  const nextLesson = course.continueLesson ?? course.lastAccessedLesson;
  const lastActivity = course.lastActivityAt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(course.lastActivityAt))
    : t('dashboard.lastActivityNone');

  return (
    <article className="rounded-md border bg-card p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 text-base font-semibold leading-snug">{course.course.title}</p>
            <CourseStatusBadge state={state} />
          </div>
          <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {t('dashboard.completedCount', {
                completed: course.completedLessons,
                total: course.totalLessons,
              })}
            </span>
            {course.activitySessions > 0 && (
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-primary" />
                {t('dashboard.sessionValue', { count: course.activitySessions })}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {nextLesson?.title ?? t('dashboard.noNextLesson')}
            </span>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>{t('dashboard.lastActivityAt', { value: lastActivity })}</span>
              <span className="font-semibold text-foreground">{course.completionPercentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${course.completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <Link
          href={getCourseProgressHref(course)}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {state === 'notStarted' ? t('dashboard.startCourse') : t('dashboard.continueCourse')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
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
      ? t('dashboard.courseStatusCompleted')
      : state === 'inProgress'
        ? t('dashboard.courseStatusInProgress')
        : t('dashboard.courseStatusNotStarted');

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>
  );
}
