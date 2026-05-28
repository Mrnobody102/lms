'use client';

import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Dumbbell,
  FileQuestion,
  History,
  Layers3,
  Loader2,
  RefreshCcw,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  usePracticeAttempts,
  usePracticeExerciseSets,
  usePracticeRecommendations,
} from '@/hooks/use-practice';
import { useCustomCards, useReviewQueue } from '@/hooks/use-srs';
import { useSkills } from '@/hooks/use-skills';
import {
  getPracticeAttemptStats,
  type PracticeAttemptSummary,
  type PracticeExerciseSetSummary,
  type PracticeRecommendation,
} from '@/lib/practice-api';
import { Link, usePathname, useRouter } from '@/navigation';

type PracticeTab = 'recommended' | 'sets' | 'review' | 'vocabulary' | 'history';

const VALID_TABS: PracticeTab[] = ['recommended', 'sets', 'review', 'vocabulary', 'history'];

export default function PracticePage() {
  const t = useTranslations('Student');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isInitialized } = useAuthStore();

  const tabParam = searchParams.get('tab');
  const activeTab: PracticeTab = VALID_TABS.includes(tabParam as PracticeTab)
    ? (tabParam as PracticeTab)
    : 'recommended';
  const courseId = searchParams.get('courseId') ?? undefined;
  const unitId = searchParams.get('unitId') ?? undefined;
  const skillFilter = searchParams.get('skill') ?? undefined;
  const selectedSkills = useMemo(
    () =>
      (skillFilter ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [skillFilter],
  );

  const { data: courseData } = useCourses({ limit: 100 }, isAuthenticated);
  const courses = courseData?.data ?? [];
  const { data: selectedCourse } = useCourse(courseId ?? '', isAuthenticated && Boolean(courseId));
  const { data: skills = [] } = useSkills(isAuthenticated);
  const filters = { courseId, unitId, skill: skillFilter };
  const {
    data: recommendations = [],
    isLoading: recommendationsLoading,
    isError: recommendationsError,
  } = usePracticeRecommendations(filters, isAuthenticated);
  const {
    data: exerciseSets = [],
    isLoading: setsLoading,
    isError: setsError,
  } = usePracticeExerciseSets(filters, isAuthenticated);
  const { data: attempts = [], isLoading: attemptsLoading } = usePracticeAttempts(
    { courseId, limit: 8 },
    isAuthenticated,
  );
  const { data: reviewQueue = [], isLoading: reviewLoading } = useReviewQueue(
    skillFilter,
    isAuthenticated,
  );
  const { data: customCards = [], isLoading: customCardsLoading } = useCustomCards(isAuthenticated);

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    const query = params.toString();
    router.replace((query ? `${pathname}?${query}` : pathname) as never);
  };

  const toggleSkill = (code: string) => {
    const next = selectedSkills.includes(code)
      ? selectedSkills.filter((skill) => skill !== code)
      : [...selectedSkills, code];
    updateQuery({ skill: next.length > 0 ? next.join(',') : undefined });
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/practice" />
        ) : (
          <>
            <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-primary">{t('practice.badge')}</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('practice.hubTitle')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t('practice.hubSubtitle')}
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

            <section className="mb-6 rounded-md border bg-card p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('practice.filters.course')}
                  </span>
                  <div className="relative">
                    <select
                      value={courseId ?? ''}
                      onChange={(event) =>
                        updateQuery({
                          courseId: event.target.value || undefined,
                          unitId: undefined,
                        })
                      }
                      className="h-12 w-full appearance-none rounded-md border border-input bg-background px-4 pr-10 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                    >
                      <option value="">{t('practice.filters.allCourses')}</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>
                <label className="flex min-w-0 flex-col gap-2 text-sm font-medium">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('practice.filters.unit')}
                  </span>
                  <div className="relative">
                    <select
                      value={unitId ?? ''}
                      onChange={(event) => updateQuery({ unitId: event.target.value || undefined })}
                      disabled={!selectedCourse?.units?.length}
                      className="h-12 w-full appearance-none rounded-md border border-input bg-background px-4 pr-10 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:text-muted-foreground"
                    >
                      <option value="">{t('practice.filters.allUnits')}</option>
                      {(selectedCourse?.units ?? []).map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    updateQuery({ courseId: undefined, unitId: undefined, skill: undefined })
                  }
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                  {t('practice.filters.clear')}
                </button>
              </div>

              {skills.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {t('practice.skillFilterLabel')}
                  </span>
                  {skills.map((skill) => {
                    const label =
                      locale.startsWith('vi') && skill.nameVi ? skill.nameVi : skill.name;
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
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
              {VALID_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => updateQuery({ tab })}
                  className={
                    'h-10 shrink-0 rounded-md border px-4 text-sm font-medium transition ' +
                    (activeTab === tab
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted')
                  }
                >
                  {t(`practice.tabs.${tab}`)}
                </button>
              ))}
            </div>

            {activeTab === 'recommended' ? (
              <RecommendationView
                items={recommendations}
                loading={recommendationsLoading}
                error={recommendationsError}
              />
            ) : null}
            {activeTab === 'sets' ? (
              <ExerciseSetView items={exerciseSets} loading={setsLoading} error={setsError} />
            ) : null}
            {activeTab === 'review' ? (
              <ReviewView queueCount={reviewQueue.length} loading={reviewLoading} />
            ) : null}
            {activeTab === 'vocabulary' ? (
              <VocabularyView cardCount={customCards.length} loading={customCardsLoading} />
            ) : null}
            {activeTab === 'history' ? (
              <HistoryView attempts={attempts} loading={attemptsLoading} locale={locale} />
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}

function RecommendationView({
  items,
  loading,
  error,
}: {
  items: PracticeRecommendation[];
  loading: boolean;
  error: boolean;
}) {
  const t = useTranslations('Student');

  if (loading) return <LoadingLine label={t('practice.loading')} />;
  if (error) return <ErrorBox label={t('practice.loadError')} />;
  if (items.length === 0)
    return <EmptyBox title={t('practice.emptyTitle')} desc={t('practice.emptyDesc')} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <PracticeCard key={item.id} item={item} reason={item.recommendationReason} />
      ))}
    </div>
  );
}

function ExerciseSetView({
  items,
  loading,
  error,
}: {
  items: PracticeExerciseSetSummary[];
  loading: boolean;
  error: boolean;
}) {
  const t = useTranslations('Student');

  if (loading) return <LoadingLine label={t('practice.loading')} />;
  if (error) return <ErrorBox label={t('practice.loadError')} />;
  if (items.length === 0)
    return <EmptyBox title={t('practice.emptyTitle')} desc={t('practice.emptyDesc')} />;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <PracticeCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ReviewView({ queueCount, loading }: { queueCount: number; loading: boolean }) {
  const t = useTranslations('Student');

  if (loading) return <LoadingLine label={t('srs.loading')} />;

  return (
    <section className="rounded-md border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconFrame icon={RefreshCcw} />
          <div>
            <h2 className="text-lg font-semibold">{t('practice.reviewTabTitle')}</h2>
            <p className="text-sm text-muted-foreground">
              {queueCount > 0
                ? t('srs.dailyReviewSubtitle', { count: queueCount })
                : t('srs.dailyReviewEmptyDesc')}
            </p>
          </div>
        </div>
        <Link
          href="/review"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t('srs.dailyReviewCta')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function VocabularyView({ cardCount, loading }: { cardCount: number; loading: boolean }) {
  const t = useTranslations('Student');

  if (loading) return <LoadingLine label={t('srs.customCards.loading')} />;

  return (
    <section className="rounded-md border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <IconFrame icon={Layers3} />
          <div>
            <h2 className="text-lg font-semibold">{t('srs.customCards.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('practice.vocabularyTabDesc', { count: cardCount })}
            </p>
          </div>
        </div>
        <Link
          href="/vocabulary"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          {t('srs.customCards.managerTitle')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function HistoryView({
  attempts,
  loading,
  locale,
}: {
  attempts: PracticeAttemptSummary[];
  loading: boolean;
  locale: string;
}) {
  const t = useTranslations('Student');

  if (loading) return <LoadingLine label={t('practice.loading')} />;
  if (attempts.length === 0) {
    return <EmptyBox title={t('practice.recentAttempts')} desc={t('practice.noAttempts')} />;
  }

  return (
    <section className="rounded-md border bg-card p-5">
      <div className="mb-4 flex items-start gap-3">
        <IconFrame icon={History} />
        <div>
          <h2 className="text-lg font-semibold">{t('practice.recentAttempts')}</h2>
          <p className="text-sm text-muted-foreground">{t('practice.recentAttemptsDesc')}</p>
        </div>
      </div>
      <div className="space-y-3">
        {attempts.map((attempt) => (
          <PracticeAttemptRow key={attempt.id} attempt={attempt} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function PracticeCard({
  item,
  reason,
}: {
  item: PracticeExerciseSetSummary | PracticeRecommendation;
  reason?: string;
}) {
  const t = useTranslations('Student');

  return (
    <article className="flex min-h-[220px] flex-col rounded-md border bg-card p-5 transition-colors hover:border-primary/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <IconFrame icon={FileQuestion} />
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
          {t('practice.questionCount', { count: item._count?.questions ?? 0 })}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {reason ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {t(`practice.recommendationReason.${reason}`)}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 line-clamp-2 text-base font-semibold">{item.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
          {item.description || t('practice.noDescription')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-md border px-2 py-1">
            {item.course?.title ?? t('practice.courseFallback')}
          </span>
          {item.unit?.title ? (
            <span className="rounded-md border px-2 py-1">{item.unit.title}</span>
          ) : null}
        </div>
      </div>
      <Link
        href={`/practice/${item.id}`}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        {t('practice.start')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
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
          {attempt.exerciseSet.unit?.title ? (
            <span className="rounded-md border px-2 py-1">{attempt.exerciseSet.unit.title}</span>
          ) : null}
          <span className="rounded-md border px-2 py-1">
            {t('practice.attemptSubmittedAtValue', {
              value: formatDateTime(attempt.submittedAt, locale),
            })}
          </span>
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

function LoadingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function ErrorBox({ label }: { label: string }) {
  return (
    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
      {label}
    </div>
  );
}

function EmptyBox({ title, desc }: { title: string; desc: string }) {
  return (
    <section className="rounded-md border border-dashed p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Dumbbell className="h-5 w-5" />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{desc}</p>
    </section>
  );
}

function IconFrame({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
