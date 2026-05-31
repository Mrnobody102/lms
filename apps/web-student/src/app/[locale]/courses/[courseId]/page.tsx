'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileCheck2,
  GraduationCap,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { CourseCertificatePanel } from '@/components/certificates/course-certificate-panel';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import { useCourse, useCourseActivities } from '@/hooks/use-courses';
import { useExams } from '@/hooks/use-exams';
import { usePracticeExerciseSets } from '@/hooks/use-practice';
import { useCourseProgress } from '@/hooks/use-progress';
import type { Course, CourseActivity, Lesson } from '@/lib/course-api';
import {
  getCourseProgressHref,
  getCourseProgressState,
  type CourseProgressState,
} from '@/lib/course-progress-utils';
import { ProgressStatus } from '@/lib/progress-api';
import { Link } from '@/navigation';

export default function CourseDetailPage() {
  const t = useTranslations('Student');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const params = useParams();
  const courseParam = params.courseId;
  const courseId = (Array.isArray(courseParam) ? courseParam[0] : courseParam) ?? '';
  const canLoadProtectedCourse = isInitialized && isAuthenticated;

  const {
    data: course,
    isLoading: isCourseLoading,
    isError: isCourseError,
  } = useCourse(courseId, canLoadProtectedCourse);
  const { data: progress = [], isLoading: isProgressLoading } = useCourseProgress(
    courseId,
    canLoadProtectedCourse,
  );
  const { data: activityTimeline, isLoading: isActivitiesLoading } = useCourseActivities(
    courseId,
    canLoadProtectedCourse,
  );
  const { data: practiceSets = [], isLoading: isPracticeLoading } = usePracticeExerciseSets(
    { courseId },
    canLoadProtectedCourse,
  );
  const { data: exams = [], isLoading: isExamsLoading } = useExams(
    { courseId },
    canLoadProtectedCourse,
  );
  const isLoading =
    !isInitialized ||
    (canLoadProtectedCourse &&
      (isCourseLoading ||
        isProgressLoading ||
        isPracticeLoading ||
        isExamsLoading ||
        isActivitiesLoading));

  const progressMap = useMemo(
    () =>
      new Map(
        progress
          .filter((item) => item.status === ProgressStatus.COMPLETED)
          .map((item) => [item.lessonId, item]),
      ),
    [progress],
  );

  if (isInitialized && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-lg px-6 py-24">
          <AuthRequiredPanel returnTo={'/courses/' + courseId} />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return <CourseDetailLoading />;
  }

  if (isCourseError || !course) {
    return <CourseDetailError />;
  }

  const lessonGroups = buildLessonGroups(course, t('lesson.ungrouped'));
  const allLessons = lessonGroups.flatMap((group) => group.lessons);
  const completedLessons = allLessons.filter((lesson) => progressMap.has(lesson.id)).length;
  const totalLessons = allLessons.length;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const continueLesson = getContinueLesson(allLessons, progressMap);
  const firstLesson = allLessons[0] ?? null;
  const courseProgressSummary = {
    course: { id: course.id, title: course.title, totalDuration: course.totalDuration },
    totalLessons,
    completedLessons,
    activitySessions: 0,
    completionPercentage,
    lastActivityAt: getLatestProgressAt(progress),
    lastAccessedLesson: null,
    continueLesson,
  };
  const state = getCourseProgressState(courseProgressSummary);
  const primaryLessonHref = firstLesson
    ? getCourseProgressHref(courseProgressSummary, firstLesson.id)
    : null;
  const publishedPracticeSets = practiceSets.filter((set) => set.isPublished);
  const publishedExams = exams.filter((item) => item.isPublished);
  const practiceSet = publishedPracticeSets[0] ?? null;
  const exam = publishedExams[0] ?? null;
  const coverImageUrl = course.coverImageUrl?.trim();

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      {/* Cover Image Banner */}
      {coverImageUrl && (
        <div
          aria-label={course.title}
          role="img"
          className="relative h-44 w-full overflow-hidden bg-muted bg-cover bg-center sm:h-52"
          style={{ backgroundImage: `url(${JSON.stringify(coverImageUrl)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/courses"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            {t('courses.backToCourses')}
          </Link>
          <CourseStatusBadge state={state} />
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-8">
            <article className="rounded-md border bg-card p-6">
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {t('courses.detailBadge')}
                      </p>
                      <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
                    </div>
                  </div>
                  <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
                    {course.description || t('courses.noDescription')}
                  </p>
                </div>
                <div className="w-full max-w-xs rounded-md border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t('courses.progress')}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{completionPercentage}%</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                    <span>
                      {t('courses.completedCount', {
                        completed: completedLessons,
                        total: totalLessons,
                      })}
                    </span>
                    <span>
                      {t('courses.totalDurationValue', { minutes: course.totalDuration ?? 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {primaryLessonHref && (
                  <Link
                    href={primaryLessonHref}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {state === 'completed'
                      ? t('courses.reviewCourse')
                      : continueLesson
                        ? t('courses.continueCourse')
                        : t('courses.startCourse')}
                  </Link>
                )}
                <Link
                  href="/practice"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                >
                  <Dumbbell className="h-4 w-4" />
                  {t('practice.title')}
                </Link>
                <Link
                  href="/exams"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
                >
                  <FileCheck2 className="h-4 w-4" />
                  {t('exam.title')}
                </Link>
              </div>
            </article>

            <CourseCertificatePanel courseId={course.id} />

            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{t('courses.curriculum')}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{t('courses.curriculumDesc')}</p>
              </div>

              {activityTimeline ? (
                <ActivityTimeline
                  units={activityTimeline.units}
                  ungrouped={activityTimeline.ungroupedActivities}
                />
              ) : (
                <LegacyLessonTimeline
                  groups={lessonGroups}
                  progressMap={progressMap}
                  continueLessonId={continueLesson?.id ?? null}
                />
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <SummaryCard
              icon={BookOpen}
              title={t('courses.summaryLessons')}
              value={t('courses.summaryLessonsValue', { count: totalLessons })}
            />
            <SummaryCard
              icon={CheckCircle2}
              title={t('courses.summaryCompleted')}
              value={t('courses.completedCount', {
                completed: completedLessons,
                total: totalLessons,
              })}
            />
            <SummaryCard
              icon={Clock3}
              title={t('courses.summaryDuration')}
              value={t('courses.totalDurationValue', { minutes: course.totalDuration ?? 0 })}
            />

            <RelatedPanel
              title={t('courses.practicePanelTitle')}
              desc={t('courses.practicePanelDesc')}
              href={practiceSet ? `/practice/${practiceSet.id}` : '/practice'}
              icon={Dumbbell}
              empty={publishedPracticeSets.length === 0}
              emptyLabel={t('courses.noPractice')}
            />
            <RelatedPanel
              title={t('courses.examPanelTitle')}
              desc={t('courses.examPanelDesc')}
              href={exam ? `/exams/${exam.id}` : '/exams'}
              icon={FileCheck2}
              empty={publishedExams.length === 0}
              emptyLabel={t('courses.noExams')}
            />
          </aside>
        </section>
      </main>
    </div>
  );
}

function CourseDetailLoading() {
  const t = useTranslations('Student');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
        {t('courses.loading')}
      </p>
    </div>
  );
}

function CourseDetailError() {
  const t = useTranslations('Student');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive">
        <FileCheck2 className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold">{t('courses.loadError')}</h1>
      <Link
        href="/courses"
        className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted"
      >
        {t('courses.backToCourses')}
      </Link>
    </div>
  );
}

function ActivityTimeline({
  units,
  ungrouped,
}: {
  units: Array<{
    id: string;
    title: string;
    activities: CourseActivity[];
  }>;
  ungrouped: CourseActivity[];
}) {
  const t = useTranslations('Student');
  const visibleGroups = [
    ...units.filter((unit) => unit.activities.length > 0),
    ...(ungrouped.length > 0
      ? [{ id: 'ungrouped', title: t('lesson.ungrouped'), activities: ungrouped }]
      : []),
  ];

  if (visibleGroups.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
        {t('courses.noLessons')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleGroups.map((group) => (
        <article key={group.id} className="rounded-md border bg-card p-5">
          <h3 className="text-sm font-semibold uppercase text-muted-foreground">{group.title}</h3>
          <div className="mt-4 space-y-3">
            {group.activities.map((activity, index) => (
              <ActivityRow key={activity.id} activity={activity} index={index + 1} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function ActivityRow({ activity, index }: { activity: CourseActivity; index: number }) {
  const t = useTranslations('Student');
  const status = activity.progress?.status ?? 'NOT_STARTED';
  const isCompleted = status === 'COMPLETED';
  const isInProgress = status === 'IN_PROGRESS';

  return (
    <div className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t('courses.activityNumber', { count: index })}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {renderActivityIcon(activity.type, 'h-3.5 w-3.5')}
            {t(`courses.activityType.${activity.type}`)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              isCompleted
                ? 'bg-emerald-500/10 text-emerald-600'
                : isInProgress
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {isCompleted
              ? t('courses.activityCompleted')
              : isInProgress
                ? t('courses.activityInProgress')
                : t('courses.activityNotStarted')}
          </span>
          {activity.progress?.scorePercent !== null &&
          activity.progress?.scorePercent !== undefined ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {t('courses.activityScore', { value: activity.progress.scorePercent })}
            </span>
          ) : null}
        </div>
        <h4 className="mt-2 text-sm font-semibold">{activity.target.title}</h4>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <Clock3 className="h-3.5 w-3.5" />
            {t('courses.lessonDurationValue', {
              minutes: activity.estimatedMinutes || activity.target.durationMinutes || 0,
            })}
          </span>
          {activity.target.questionCount !== undefined ? (
            <span className="rounded-md border px-2 py-1">
              {t('practice.questionCount', { count: activity.target.questionCount })}
            </span>
          ) : null}
        </div>
      </div>
      <Link
        href={activity.target.href}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
      >
        {getActivityCta(activity.type, status, t)}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function LegacyLessonTimeline({
  groups,
  progressMap,
  continueLessonId,
}: {
  groups: Array<{ id: string; title: string; lessons: Lesson[] }>;
  progressMap: ReadonlyMap<string, { lessonId: string }>;
  continueLessonId: string | null;
}) {
  const t = useTranslations('Student');

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <article key={group.id} className="rounded-md border bg-card p-5">
          {group.title && (
            <h3 className="text-sm font-semibold uppercase text-muted-foreground">{group.title}</h3>
          )}
          <div className={group.title ? 'mt-4 space-y-3' : 'space-y-3'}>
            {group.lessons.map((lesson, index) => {
              const isCompleted = progressMap.has(lesson.id);
              const isNext = continueLessonId === lesson.id;
              return (
                <div
                  key={lesson.id}
                  className="flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {t('courses.lessonNumber', { count: index + 1 })}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : isNext
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted
                          ? t('courses.lessonCompleted')
                          : isNext
                            ? t('courses.lessonNext')
                            : t('courses.lessonPending')}
                      </span>
                    </div>
                    <h4 className="mt-2 text-sm font-semibold">{lesson.title}</h4>
                  </div>
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
                  >
                    {isCompleted ? t('courses.reviewLesson') : t('courses.openLesson')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </div>
  );
}

function renderActivityIcon(type: CourseActivity['type'], className: string) {
  switch (type) {
    case 'LESSON':
      return <BookOpen className={className} />;
    case 'PRACTICE':
      return <Dumbbell className={className} />;
    case 'EXAM':
      return <FileCheck2 className={className} />;
    case 'ROLEPLAY':
      return <GraduationCap className={className} />;
  }
}

function getActivityCta(
  type: CourseActivity['type'],
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
  t: ReturnType<typeof useTranslations>,
) {
  if (status === 'COMPLETED') {
    return type === 'LESSON' ? t('courses.reviewLesson') : t('courses.reviewActivity');
  }
  if (status === 'IN_PROGRESS') {
    return type === 'EXAM' ? t('exam.resumeAttempt') : t('courses.continueActivity');
  }
  switch (type) {
    case 'LESSON':
      return t('courses.openLesson');
    case 'PRACTICE':
      return t('practice.start');
    case 'EXAM':
      return t('exam.open');
    case 'ROLEPLAY':
      return t('roleplay.startPracticing');
  }
}

function SummaryCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
}) {
  return (
    <article className="rounded-md border bg-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </article>
  );
}

function RelatedPanel({
  title,
  desc,
  href,
  icon: Icon,
  empty,
  emptyLabel,
}: {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  empty: boolean;
  emptyLabel: string;
}) {
  return (
    <article className="rounded-md border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="mt-4">
        {empty ? (
          <div className="rounded-md border border-dashed px-3 py-4 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <Link
            href={href}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            {title}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
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
      ? t('courses.courseStatusCompleted')
      : state === 'inProgress'
        ? t('courses.courseStatusInProgress')
        : t('courses.courseStatusNotStarted');

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{label}</span>
  );
}

function buildLessonGroups(course: Course, ungroupedLabel: string) {
  const units = [...(course.units ?? [])].sort((a, b) => a.order - b.order);
  const sortedLessons = [...(course.lessons ?? [])].sort((a, b) => a.order - b.order);
  const groupedLessonIds = new Set(
    units.flatMap((unit) => (unit.lessons ?? []).map((lesson) => lesson.id)),
  );
  const ungroupedLessons = sortedLessons.filter(
    (lesson) => !lesson.unitId || !groupedLessonIds.has(lesson.id),
  );

  return units.length > 0
    ? [
        ...units.map((unit) => ({
          id: unit.id,
          title: unit.title,
          lessons: [...(unit.lessons ?? [])].sort((a, b) => a.order - b.order),
        })),
        ...(ungroupedLessons.length > 0
          ? [{ id: 'ungrouped', title: ungroupedLabel, lessons: ungroupedLessons }]
          : []),
      ]
    : [{ id: 'all', title: ungroupedLabel, lessons: sortedLessons }];
}

function getContinueLesson(lessons: Lesson[], progressMap: Map<string, { lessonId: string }>) {
  return lessons.find((lesson) => !progressMap.has(lesson.id)) ?? null;
}

function getLatestProgressAt(progress: Array<{ updatedAt: string }>) {
  const latest = progress.reduce<number | null>((currentLatest, item) => {
    const timestamp = new Date(item.updatedAt).getTime();
    if (!Number.isFinite(timestamp)) {
      return currentLatest;
    }
    return currentLatest === null ? timestamp : Math.max(currentLatest, timestamp);
  }, null);

  return latest === null ? null : new Date(latest).toISOString();
}
