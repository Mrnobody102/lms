'use client';

import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock3,
  FileCheck2,
  History,
  Loader2,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';
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
  const hasActiveAttempt = useMemo(
    () =>
      attempts.some((attempt) => attempt.status === 'STARTED' && !isAttemptExpired(attempt, now)),
    [attempts, now],
  );
  const overview = useMemo(() => buildExamOverview(exams, attempts, now), [attempts, exams, now]);

  useEffect(() => {
    if (!hasActiveAttempt) {
      return undefined;
    }

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasActiveAttempt]);

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
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('exam.loading')}
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                {t('exam.loadError')}
              </div>
            ) : exams.length === 0 ? (
              <section className="rounded-md border border-dashed p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">{t('exam.emptyTitle')}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {t('exam.emptyDesc')}
                </p>
              </section>
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

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {exams.map((exam) => (
                    <article
                      key={exam.id}
                      className="flex min-h-[230px] flex-col rounded-md border bg-card p-5 transition-colors hover:border-primary/40"
                    >
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
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {exam.description || t('exam.noDescription')}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border px-2 py-1">
                            {exam.course?.title ?? t('exam.courseFallback')}
                          </span>
                          {exam.unit?.title && (
                            <span className="rounded-md border px-2 py-1">{exam.unit.title}</span>
                          )}
                          {exam.passingScore !== null && exam.passingScore !== undefined && (
                            <span className="rounded-md border px-2 py-1">
                              {t('exam.passingScoreValue', { value: exam.passingScore })}
                            </span>
                          )}
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
                    <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('exam.loadingAttempts')}
                    </div>
                  ) : isAttemptsError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                      <div>{t('exam.attemptsLoadError')}</div>
                      <button
                        type="button"
                        onClick={() => void refetchAttempts()}
                        className="mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-md border border-destructive/20 bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {t('exam.retry')}
                      </button>
                    </div>
                  ) : attempts.length === 0 ? (
                    <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                      {t('exam.noAttempts')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attempts.map((attempt) => {
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
