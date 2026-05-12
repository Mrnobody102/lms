'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, Dumbbell, FileCheck2, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useExamAttempts } from '@/hooks/use-exams';
import { usePracticeAttempts } from '@/hooks/use-practice';
import type { ExamAttemptSummary } from '@/lib/exam-api';
import { getPracticeAttemptStats, type PracticeAttemptSummary } from '@/lib/practice-api';
import { Link } from '@/navigation';

export function RecentLearningWork() {
  const t = useTranslations('Student');
  const locale = useLocale();
  const {
    data: practiceAttempts = [],
    isLoading: isPracticeLoading,
    isError: isPracticeError,
  } = usePracticeAttempts({ limit: 3 });
  const {
    data: examAttempts = [],
    isLoading: isExamLoading,
    isError: isExamError,
  } = useExamAttempts({ limit: 3 });
  const isLoading = isPracticeLoading || isExamLoading;
  const isError = isPracticeError || isExamError;
  const isEmpty = practiceAttempts.length === 0 && examAttempts.length === 0;

  return (
    <section className="mt-12 space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t('dashboard.recentWorkTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t('dashboard.recentWorkDesc')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/practice"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <Dumbbell className="h-4 w-4" />
            {t('practice.title')}
          </Link>
          <Link
            href="/exams"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
          >
            <FileCheck2 className="h-4 w-4" />
            {t('exam.title')}
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('dashboard.recentWorkLoading')}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
          {t('dashboard.recentWorkError')}
        </div>
      ) : isEmpty ? (
        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
          {t('dashboard.recentWorkEmpty')}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <RecentPracticeAttempts attempts={practiceAttempts} locale={locale} />
          <RecentExamAttempts attempts={examAttempts} locale={locale} />
        </div>
      )}
    </section>
  );
}

function RecentPracticeAttempts({
  attempts,
  locale,
}: {
  attempts: PracticeAttemptSummary[];
  locale: string;
}) {
  const t = useTranslations('Student');

  return (
    <article className="rounded-md border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Dumbbell className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{t('dashboard.recentPracticeTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('dashboard.recentPracticeDesc')}</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <EmptyRecentWork href="/practice" label={t('dashboard.startPractice')} />
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => (
            <RecentPracticeAttempt key={attempt.id} attempt={attempt} locale={locale} />
          ))}
        </div>
      )}
    </article>
  );
}

function RecentPracticeAttempt({
  attempt,
  locale,
}: {
  attempt: PracticeAttemptSummary;
  locale: string;
}) {
  const t = useTranslations('Student');
  const stats = getPracticeAttemptStats(attempt);

  return (
    <Link
      href={`/practice/attempts/${attempt.id}`}
      className="block rounded-md border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="line-clamp-1 text-sm font-semibold">{attempt.exerciseSet.title}</h4>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {attempt.exerciseSet.course.title}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {t('practice.percentageValue', {
            value: getPercentage(attempt.score, attempt.totalPoints),
          })}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {t('practice.answeredCountValue', {
            count: stats.answeredCount,
            total: attempt.totalPoints,
          })}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
          <Clock3 className="h-3.5 w-3.5" />
          {formatDateTime(attempt.submittedAt, locale)}
        </span>
      </div>
    </Link>
  );
}

function RecentExamAttempts({
  attempts,
  locale,
}: {
  attempts: ExamAttemptSummary[];
  locale: string;
}) {
  const t = useTranslations('Student');
  const [now] = useState(() => Date.now());

  return (
    <article className="rounded-md border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileCheck2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold">{t('dashboard.recentExamTitle')}</h3>
          <p className="text-xs text-muted-foreground">{t('dashboard.recentExamDesc')}</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <EmptyRecentWork href="/exams" label={t('dashboard.startExam')} />
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const expired = isAttemptExpired(attempt, now);
            const href =
              attempt.status === 'STARTED' && !expired
                ? `/exams/${attempt.exam.id}`
                : `/exams/attempts/${attempt.id}`;

            return (
              <Link
                key={attempt.id}
                href={href}
                className="block rounded-md border p-4 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="line-clamp-1 text-sm font-semibold">{attempt.exam.title}</h4>
                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                      {attempt.exam.course.title}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      attempt.status === 'STARTED'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    {attempt.status === 'STARTED'
                      ? expired
                        ? t('exam.expiredBadge')
                        : t('exam.inProgress')
                      : t('exam.percentageValue', {
                          value: getPercentage(attempt.score, attempt.totalPoints),
                        })}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDateTime(attempt.startedAt, locale)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
                    <ArrowRight className="h-3.5 w-3.5" />
                    {attempt.status === 'STARTED' && !expired
                      ? t('exam.resumeAttempt')
                      : t('exam.reviewAttempt')}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </article>
  );
}

function EmptyRecentWork({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border border-dashed p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function getPercentage(score: number, totalPoints: number) {
  return Math.round((score / Math.max(totalPoints, 1)) * 100);
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function isAttemptExpired(attempt: ExamAttemptSummary, now: number) {
  return attempt.isExpired || new Date(attempt.deadlineAt).getTime() <= now;
}
