'use client';

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock3,
  FileCheck2,
  History,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@repo/ui';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import { useExamAttempts, useExams } from '@/hooks/use-exams';
import type { ExamAttemptSummary, ExamSummary } from '@/lib/exam-api';
import { Link } from '@/navigation';

export default function ExamsPage() {
  const t = useTranslations('Student');
  const locale = useLocale();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: exams = [], isLoading, isError } = useExams(undefined, isAuthenticated);
  const {
    data: attempts = [],
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
    refetch: refetchAttempts,
  } = useExamAttempts({ limit: 5 }, isAuthenticated);
  const [now, setNow] = useState(() => Date.now());
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const courseOptions = useMemo(
    () => buildExamCourseOptions(exams, t('exam.courseFallback')),
    [exams, t],
  );
  const filteredExams = useMemo(
    () =>
      selectedCourseId === 'all'
        ? exams
        : exams.filter((exam) => getExamCourseId(exam) === selectedCourseId),
    [exams, selectedCourseId],
  );
  const filteredAttempts = useMemo(
    () =>
      selectedCourseId === 'all'
        ? attempts
        : attempts.filter((attempt) => attempt.exam.course.id === selectedCourseId),
    [attempts, selectedCourseId],
  );
  const hasActiveAttempt = useMemo(
    () =>
      filteredAttempts.some(
        (attempt) => attempt.status === 'STARTED' && !isAttemptExpired(attempt, now),
      ),
    [filteredAttempts, now],
  );
  const overview = useMemo(
    () => buildExamOverview(filteredExams, filteredAttempts, now),
    [filteredAttempts, filteredExams, now],
  );
  const activeAttempts = filteredAttempts.filter(
    (attempt) => attempt.status === 'STARTED' && !isAttemptExpired(attempt, now),
  );
  const examCourseGroups = useMemo(
    () => buildExamCourseGroups(filteredExams, t('exam.courseFallback')),
    [filteredExams, t],
  );

  useEffect(() => {
    if (!hasActiveAttempt) {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasActiveAttempt]);

  useEffect(() => {
    if (
      selectedCourseId !== 'all' &&
      courseOptions.every((course) => course.id !== selectedCourseId)
    ) {
      setSelectedCourseId('all');
    }
  }, [courseOptions, selectedCourseId]);

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/exams" />
        ) : (
          <>
            <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">{t('exam.badge')}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('exam.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('exam.subtitle')}</p>
              </div>
              <Link
                href="/courses"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                <BookOpen className="h-4 w-4" />
                {t('dashboard.allCourses')}
              </Link>
            </header>

            {!isInitialized || isLoading ? (
              <LoadingState title={t('exam.loading')} className="rounded-md border bg-card" />
            ) : isError ? (
              <ErrorState title={t('exam.loadError')} className="rounded-md" />
            ) : exams.length === 0 ? (
              <EmptyState
                icon={FileCheck2}
                title={t('exam.emptyTitle')}
                description={t('exam.emptyDesc')}
                className="rounded-md border border-dashed bg-card"
              />
            ) : (
              <div className="space-y-10">
                {!isAttemptsLoading && !isAttemptsError && (
                  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <OverviewMetric
                      icon={<FileCheck2 className="h-5 w-5" />}
                      label={t('exam.publishedExams')}
                      value={t('exam.publishedExamsValue', { count: overview.publishedExams })}
                    />
                    <OverviewMetric
                      icon={<PlayCircle className="h-5 w-5" />}
                      label={t('exam.activeAttempts')}
                      value={t('exam.activeAttemptsValue', {
                        count: overview.activeAttempts,
                      })}
                    />
                    <OverviewMetric
                      icon={<History className="h-5 w-5" />}
                      label={t('exam.submittedAttempts')}
                      value={t('exam.submittedAttemptsValue', {
                        count: overview.submittedAttempts,
                      })}
                    />
                    <OverviewMetric
                      icon={<BarChart3 className="h-5 w-5" />}
                      label={t('exam.averageScore')}
                      value={t('exam.averageScoreValue', { value: overview.averageScore })}
                    />
                  </section>
                )}

                {courseOptions.length > 1 ? (
                  <section className="rounded-md border bg-card p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_280px] md:items-center">
                      <div>
                        <h2 className="text-base font-semibold">{t('exam.examsByCourse')}</h2>
                        <p className="text-sm text-muted-foreground">
                          {t('exam.examsByCourseDesc')}
                        </p>
                      </div>
                      <label className="space-y-1.5">
                        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          {t('exam.filters.course')}
                        </span>
                        <select
                          value={selectedCourseId}
                          onChange={(event) => setSelectedCourseId(event.target.value)}
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option value="all">{t('exam.filters.allCourses')}</option>
                          {courseOptions.map((course) => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </section>
                ) : null}

                {activeAttempts.length > 0 ? (
                  <section className="rounded-md border bg-card p-6">
                    <SectionHeading
                      icon={<PlayCircle className="h-5 w-5" />}
                      title={t('exam.activeAttempts')}
                      desc={t('exam.activeAttemptsDesc')}
                    />
                    <div className="mt-5 space-y-3">
                      {activeAttempts.map((attempt) => (
                        <AttemptRow key={attempt.id} attempt={attempt} now={now} locale={locale} />
                      ))}
                    </div>
                  </section>
                ) : null}

                <div className="space-y-6">
                  {examCourseGroups.map((group) => (
                    <CourseExamGroup key={group.id} group={group} />
                  ))}
                </div>

                <section className="rounded-md border bg-card p-6">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <History className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold">{t('exam.recentAttempts')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('exam.recentAttemptsDesc')}
                      </p>
                    </div>
                  </div>

                  {isAttemptsLoading ? (
                    <LoadingState title={t('exam.loadingAttempts')} className="rounded-md border" />
                  ) : isAttemptsError ? (
                    <ErrorState
                      title={t('exam.attemptsLoadError')}
                      action={
                        <button
                          type="button"
                          onClick={() => void refetchAttempts()}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/20 bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t('exam.retry')}
                        </button>
                      }
                    />
                  ) : filteredAttempts.length === 0 ? (
                    <EmptyState
                      icon={History}
                      title={t('exam.noAttempts')}
                      className="rounded-md border border-dashed"
                    />
                  ) : (
                    <div className="space-y-3">
                      {filteredAttempts.map((attempt) => {
                        const attemptExpired = isAttemptExpired(attempt, now);

                        return (
                          <article
                            key={attempt.id}
                            className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold">{attempt.exam.title}</h3>
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                  {attempt.status === 'SUBMITTED'
                                    ? t('exam.scoreValue', {
                                        score: attempt.score,
                                        total: attempt.totalPoints,
                                      })
                                    : t('exam.inProgress')}
                                </span>
                                {attempt.status === 'SUBMITTED' &&
                                  attempt.exam.passingScore !== null &&
                                  attempt.exam.passingScore !== undefined && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                        getAttemptPercentage(attempt.score, attempt.totalPoints) >=
                                        attempt.exam.passingScore
                                          ? 'bg-emerald-500/10 text-emerald-600'
                                          : 'bg-destructive/10 text-destructive'
                                      }`}
                                    >
                                      {getAttemptPercentage(attempt.score, attempt.totalPoints) >=
                                      attempt.exam.passingScore
                                        ? t('exam.passed')
                                        : t('exam.notPassed')}
                                    </span>
                                  )}
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="rounded-md border px-2 py-1">
                                  {attempt.exam.course.title}
                                </span>
                                {attempt.exam.unit?.title && (
                                  <span className="rounded-md border px-2 py-1">
                                    {attempt.exam.unit.title}
                                  </span>
                                )}
                                <span className="rounded-md border px-2 py-1">
                                  {t('exam.attemptStartedAtValue', {
                                    value: formatDateTime(attempt.startedAt, locale),
                                  })}
                                </span>
                                {attempt.status === 'SUBMITTED' && attempt.submittedAt && (
                                  <span className="rounded-md border px-2 py-1">
                                    {t('exam.attemptSubmittedAtValue', {
                                      value: formatDateTime(attempt.submittedAt, locale),
                                    })}
                                  </span>
                                )}
                                {attempt.status === 'STARTED' && !attemptExpired && (
                                  <span className="rounded-md border px-2 py-1">
                                    <Clock3 className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
                                    {t('exam.timeRemainingValue', {
                                      value: formatRemainingTime(attempt.deadlineAt, now),
                                    })}
                                  </span>
                                )}
                                {attempt.status === 'STARTED' && attemptExpired && (
                                  <span className="rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-destructive">
                                    {t('exam.expiredBadge')}
                                  </span>
                                )}
                              </div>
                            </div>

                            <Link
                              href={
                                attempt.status === 'STARTED' && !attemptExpired
                                  ? `/exams/${attempt.exam.id}`
                                  : `/exams/attempts/${attempt.id}`
                              }
                              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
                            >
                              {attempt.status === 'STARTED' && !attemptExpired
                                ? t('exam.resumeAttempt')
                                : t('exam.reviewAttempt')}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

interface ExamCourseOption {
  id: string;
  title: string;
}

interface ExamCourseGroup extends ExamCourseOption {
  unitTests: ExamSummary[];
  mockTests: ExamSummary[];
}

function CourseExamGroup({ group }: { group: ExamCourseGroup }) {
  const t = useTranslations('Student');
  const examCount = group.unitTests.length + group.mockTests.length;

  return (
    <section className="rounded-md border bg-card p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <SectionHeading
          icon={<BookOpen className="h-5 w-5" />}
          title={group.title}
          desc={t('exam.courseExamCount', { count: examCount })}
        />
      </div>
      <div className="mt-6 space-y-7">
        <ExamListBlock
          title={t('exam.unitTests')}
          desc={t('exam.unitTestsDesc')}
          exams={group.unitTests}
          emptyLabel={t('exam.noUnitTests')}
        />
        <ExamListBlock
          title={t('exam.mockTests')}
          desc={t('exam.mockTestsDesc')}
          exams={group.mockTests}
          emptyLabel={t('exam.noMockTests')}
        />
      </div>
    </section>
  );
}

function ExamListBlock({
  title,
  desc,
  exams,
  emptyLabel,
}: {
  title: string;
  desc: string;
  exams: ExamSummary[];
  emptyLabel: string;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileCheck2 className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {exams.length === 0 ? (
        <div className="mt-5 rounded-md border border-dashed p-5 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam }: { exam: ExamSummary }) {
  const t = useTranslations('Student');

  return (
    <article className="flex min-h-[230px] flex-col rounded-md border bg-background p-5 transition-colors hover:border-primary/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {t('exam.durationValue', { minutes: exam.durationMinutes })}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="line-clamp-2 text-base font-semibold">{exam.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {exam.description || t('exam.noDescription')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border px-2 py-1">
            {exam.course?.title ?? t('exam.courseFallback')}
          </span>
          {exam.unit?.title ? (
            <span className="rounded-md border px-2 py-1">{exam.unit.title}</span>
          ) : null}
          {exam.passingScore !== null && exam.passingScore !== undefined ? (
            <span className="rounded-md border px-2 py-1">
              {t('exam.passingScoreValue', { value: exam.passingScore })}
            </span>
          ) : null}
        </div>
      </div>

      <Link
        href={`/exams/${exam.id}`}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {t('exam.open')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function AttemptRow({
  attempt,
  now,
  locale,
}: {
  attempt: ExamAttemptSummary;
  now: number;
  locale: string;
}) {
  const t = useTranslations('Student');
  const attemptExpired = isAttemptExpired(attempt, now);

  return (
    <article className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{attempt.exam.title}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {attempt.status === 'SUBMITTED'
              ? t('exam.scoreValue', {
                  score: attempt.score,
                  total: attempt.totalPoints,
                })
              : t('exam.inProgress')}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border px-2 py-1">{attempt.exam.course.title}</span>
          {attempt.exam.unit?.title ? (
            <span className="rounded-md border px-2 py-1">{attempt.exam.unit.title}</span>
          ) : null}
          <span className="rounded-md border px-2 py-1">
            {t('exam.attemptStartedAtValue', {
              value: formatDateTime(attempt.startedAt, locale),
            })}
          </span>
          {attempt.status === 'STARTED' && !attemptExpired ? (
            <span className="rounded-md border px-2 py-1">
              <Clock3 className="mr-1 inline-block h-3.5 w-3.5 align-[-2px]" />
              {t('exam.timeRemainingValue', {
                value: formatRemainingTime(attempt.deadlineAt, now),
              })}
            </span>
          ) : null}
        </div>
      </div>

      <Link
        href={
          attempt.status === 'STARTED' && !attemptExpired
            ? `/exams/${attempt.exam.id}`
            : `/exams/attempts/${attempt.id}`
        }
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
      >
        {attempt.status === 'STARTED' && !attemptExpired
          ? t('exam.resumeAttempt')
          : t('exam.reviewAttempt')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function SectionHeading({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

function OverviewMetric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <article className="rounded-md border bg-card p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold leading-tight">{value}</p>
    </article>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatRemainingTime(deadlineAt: string, now: number) {
  const remainingMs = Math.max(0, new Date(deadlineAt).getTime() - now);
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getAttemptPercentage(score: number, totalPoints: number) {
  return Math.round((score / Math.max(totalPoints, 1)) * 100);
}

function buildExamOverview(exams: ExamSummary[], attempts: ExamAttemptSummary[], now: number) {
  const activeAttempts = attempts.filter(
    (attempt) => attempt.status === 'STARTED' && !isAttemptExpired(attempt, now),
  ).length;
  const submittedAttempts = attempts.filter((attempt) => attempt.status === 'SUBMITTED');
  const averageScore =
    submittedAttempts.length === 0
      ? 0
      : Math.round(
          submittedAttempts.reduce(
            (sum, attempt) => sum + getAttemptPercentage(attempt.score, attempt.totalPoints),
            0,
          ) / submittedAttempts.length,
        );

  return {
    publishedExams: exams.filter((exam) => exam.isPublished).length,
    activeAttempts,
    submittedAttempts: submittedAttempts.length,
    averageScore,
  };
}

function isAttemptExpired(attempt: ExamAttemptSummary, now: number) {
  return attempt.isExpired || new Date(attempt.deadlineAt).getTime() <= now;
}

function buildExamCourseOptions(exams: ExamSummary[], fallbackTitle: string): ExamCourseOption[] {
  const courses = new Map<string, ExamCourseOption>();

  exams.forEach((exam) => {
    const id = getExamCourseId(exam);
    if (!courses.has(id)) {
      courses.set(id, {
        id,
        title: exam.course?.title ?? fallbackTitle,
      });
    }
  });

  return Array.from(courses.values()).sort((a, b) => a.title.localeCompare(b.title));
}

function buildExamCourseGroups(exams: ExamSummary[], fallbackTitle: string): ExamCourseGroup[] {
  const groups = new Map<string, ExamCourseGroup>();

  exams.forEach((exam) => {
    const id = getExamCourseId(exam);
    const group =
      groups.get(id) ??
      ({
        id,
        title: exam.course?.title ?? fallbackTitle,
        unitTests: [],
        mockTests: [],
      } satisfies ExamCourseGroup);

    if (hasExamUnit(exam)) {
      group.unitTests.push(exam);
    } else {
      group.mockTests.push(exam);
    }

    groups.set(id, group);
  });

  return Array.from(groups.values()).sort((a, b) => a.title.localeCompare(b.title));
}

function getExamCourseId(exam: ExamSummary) {
  return exam.course?.id ?? exam.courseId ?? 'unknown-course';
}

function hasExamUnit(exam: ExamSummary) {
  return Boolean(exam.unitId ?? exam.unit?.id);
}
