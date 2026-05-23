'use client';

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  FileQuestion,
  History,
  Loader2,
  MessageSquare,
  X,
} from 'lucide-react';
import { ReactNode, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import { usePracticeAttempts, usePracticeExerciseSets } from '@/hooks/use-practice';
import { useSkills } from '@/hooks/use-skills';
import { getPracticeAttemptStats, type PracticeAttemptSummary } from '@/lib/practice-api';
import { Link, usePathname, useRouter } from '@/navigation';

export default function PracticePage() {
  const t = useTranslations('Student');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const skillFilter = searchParams.get('skill');
  const selectedSkills = useMemo(
    () =>
      (skillFilter ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [skillFilter],
  );
  const { data: skills = [] } = useSkills(isAuthenticated);
  const {
    data: exerciseSets = [],
    isLoading,
    isError,
  } = usePracticeExerciseSets(skillFilter ? { skill: skillFilter } : undefined, isAuthenticated);
  const { data: attempts = [], isError: isAttemptsError } = usePracticeAttempts(
    { limit: 5 },
    isAuthenticated,
  );
  const overview = useMemo(
    () => buildPracticeOverview(exerciseSets, attempts),
    [attempts, exerciseSets],
  );

  const updateSkills = (next: string[]) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (next.length > 0) {
      params.set('skill', next.join(','));
    } else {
      params.delete('skill');
    }
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as never);
  };

  const toggleSkill = (code: string) => {
    if (selectedSkills.includes(code)) {
      updateSkills(selectedSkills.filter((s) => s !== code));
    } else {
      updateSkills([...selectedSkills, code]);
    }
  };

  const clearSkills = () => updateSkills([]);

  const activeSkillLabels = selectedSkills
    .map((code) => {
      const found = skills.find((s) => s.code === code);
      if (!found) return code;
      return locale.startsWith('vi') && found.nameVi ? found.nameVi : found.name;
    })
    .join(', ');

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/practice" />
        ) : (
          <>
            <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">{t('practice.badge')}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('practice.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t('practice.subtitle')}
                </p>
              </div>
              <Link
                href="/courses"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                <BookOpen className="h-4 w-4" />
                {t('dashboard.allCourses')}
              </Link>
            </header>

            {skills.length > 0 ? (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('practice.skillFilterLabel')}
                </span>
                <button
                  type="button"
                  onClick={clearSkills}
                  className={
                    'rounded-full border px-3 py-1 text-xs transition ' +
                    (selectedSkills.length === 0
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input hover:bg-muted')
                  }
                >
                  {t('practice.skillFilterAll')}
                </button>
                {skills.map((skill) => {
                  const label = locale.startsWith('vi') && skill.nameVi ? skill.nameVi : skill.name;
                  const isActive = selectedSkills.includes(skill.code);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.code)}
                      aria-pressed={isActive}
                      className={
                        'rounded-full border px-3 py-1 text-xs transition ' +
                        (isActive
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input hover:bg-muted')
                      }
                      style={
                        isActive && skill.color
                          ? {
                              backgroundColor: skill.color,
                              borderColor: skill.color,
                              color: '#fff',
                            }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  );
                })}
                {selectedSkills.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearSkills}
                    className="inline-flex items-center gap-1 rounded-full border border-input px-3 py-1 text-xs hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    {t('practice.skillFilterClear')}
                  </button>
                ) : null}
              </div>
            ) : null}

            {!isInitialized || isLoading ? (
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('practice.loading')}
              </div>
            ) : isError ? (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                {t('practice.loadError')}
              </div>
            ) : exerciseSets.length === 0 ? (
              <section className="rounded-md border border-dashed p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">
                  {selectedSkills.length > 0
                    ? t('practice.emptySkillTitle')
                    : t('practice.emptyTitle')}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  {selectedSkills.length > 0
                    ? t('practice.emptySkillDesc', { skill: activeSkillLabels })
                    : t('practice.emptyDesc')}
                </p>
                {selectedSkills.length > 0 ? (
                  <button
                    type="button"
                    onClick={clearSkills}
                    className="mt-4 inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                    {t('practice.skillFilterClear')}
                  </button>
                ) : null}
              </section>
            ) : (
              <div className="space-y-10">
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <OverviewMetric
                    icon={<BookOpen className="h-5 w-5" />}
                    label={t('practice.publishedSets')}
                    value={t('practice.publishedSetsValue', { count: exerciseSets.length })}
                  />
                  <OverviewMetric
                    icon={<FileQuestion className="h-5 w-5" />}
                    label={t('practice.totalQuestions')}
                    value={t('practice.totalQuestionsValue', { count: overview.totalQuestions })}
                  />
                  <OverviewMetric
                    icon={<History className="h-5 w-5" />}
                    label={t('practice.recentAttempts')}
                    value={t('practice.recentAttemptValue', { count: attempts.length })}
                  />
                  <OverviewMetric
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    label={t('practice.averageAccuracy')}
                    value={t('practice.averageAccuracyValue', { value: overview.averageAccuracy })}
                  />
                  <OverviewMetric
                    icon={<MessageSquare className="h-5 w-5" />}
                    label={t('practice.aiReviewSummary')}
                    value={t('practice.aiReviewSummaryValue', {
                      reviewed: overview.aiReviewedCount,
                      pending: overview.aiPendingCount,
                    })}
                  />
                </section>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {exerciseSets.map((set) => (
                    <article
                      key={set.id}
                      className="flex min-h-[220px] flex-col rounded-md border bg-card p-5 transition-colors hover:border-primary/40"
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <FileQuestion className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                          {t('practice.questionCount', { count: set._count?.questions ?? 0 })}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h2 className="line-clamp-2 text-base font-semibold">{set.title}</h2>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {set.description || t('practice.noDescription')}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border px-2 py-1">
                            {set.course?.title ?? t('practice.courseFallback')}
                          </span>
                          {set.unit?.title && (
                            <span className="rounded-md border px-2 py-1">{set.unit.title}</span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/practice/${set.id}`}
                        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        {t('practice.start')}
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
                      <h2 className="text-lg font-semibold">{t('practice.recentAttempts')}</h2>
                      <p className="text-sm text-muted-foreground">
                        {t('practice.recentAttemptsDesc')}
                      </p>
                    </div>
                  </div>

                  {isAttemptsError ? (
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
                      {t('practice.attemptsLoadError')}
                    </div>
                  ) : attempts.length === 0 ? (
                    <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                      {t('practice.noAttempts')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {attempts.map((attempt) => (
                        <PracticeAttemptRow key={attempt.id} attempt={attempt} locale={locale} />
                      ))}
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

function PracticeAttemptRow({
  attempt,
  locale,
}: {
  attempt: PracticeAttemptSummary;
  locale: string;
}) {
  const t = useTranslations('Student');
  const stats = getPracticeAttemptStats(attempt);

  return (
    <article className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">{attempt.exerciseSet.title}</h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
            {t('practice.scoreValue', {
              score: attempt.score,
              total: attempt.totalPoints,
            })}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {t('practice.answeredCountValue', {
              count: stats.answeredCount,
              total: attempt.totalPoints,
            })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border px-2 py-1">{attempt.exerciseSet.course.title}</span>
          {attempt.exerciseSet.unit?.title && (
            <span className="rounded-md border px-2 py-1">{attempt.exerciseSet.unit.title}</span>
          )}
          <span className="rounded-md border px-2 py-1">
            {t('practice.attemptSubmittedAtValue', {
              value: formatDateTime(attempt.submittedAt, locale),
            })}
          </span>
          {stats.aiAnsweredCount > 0 && (
            <span className="rounded-md border px-2 py-1">
              {t('practice.aiReviewSummaryValue', {
                reviewed: stats.aiReviewedCount,
                pending: stats.aiPendingCount,
              })}
            </span>
          )}
        </div>
      </div>

      <Link
        href={`/practice/attempts/${attempt.id}`}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
      >
        {t('practice.reviewAttempt')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
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

type PracticeOverviewAttempt = {
  score: number;
  totalPoints: number;
  stats?: PracticeAttemptSummary['stats'];
};

function buildPracticeOverview(
  exerciseSets: Array<{ _count?: { questions: number } }>,
  attempts: PracticeOverviewAttempt[],
) {
  const totalQuestions = exerciseSets.reduce((sum, set) => sum + (set._count?.questions ?? 0), 0);
  const totalScore = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
  const totalPoints = attempts.reduce((sum, attempt) => sum + Math.max(attempt.totalPoints, 0), 0);
  const averageAccuracy = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;
  const aiReviewedCount = attempts.reduce(
    (sum, attempt) => sum + getPracticeAttemptStats(attempt).aiReviewedCount,
    0,
  );
  const aiPendingCount = attempts.reduce(
    (sum, attempt) => sum + getPracticeAttemptStats(attempt).aiPendingCount,
    0,
  );

  return {
    totalQuestions,
    averageAccuracy,
    aiReviewedCount,
    aiPendingCount,
  };
}
