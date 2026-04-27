'use client';

import { ArrowRight, BookOpen, Dumbbell, FileQuestion, History, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { usePracticeAttempts, usePracticeExerciseSets } from '@/hooks/use-practice';
import { Link } from '@/navigation';

export default function PracticePage() {
  const t = useTranslations('Student');
  const { data: exerciseSets = [], isLoading, isError } = usePracticeExerciseSets();
  const { data: attempts = [] } = usePracticeAttempts({ limit: 5 });

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{t('practice.badge')}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('practice.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t('practice.subtitle')}</p>
          </div>
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <BookOpen className="h-4 w-4" />
            {t('dashboard.allCourses')}
          </Link>
        </header>

        {isLoading ? (
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
            <h2 className="text-lg font-semibold">{t('practice.emptyTitle')}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              {t('practice.emptyDesc')}
            </p>
          </section>
        ) : (
          <div className="space-y-10">
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

              {attempts.length === 0 ? (
                <div className="rounded-md border border-dashed p-5 text-sm text-muted-foreground">
                  {t('practice.noAttempts')}
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt) => (
                    <article
                      key={attempt.id}
                      className="flex flex-col gap-4 rounded-md border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">{attempt.exerciseSet.title}</h3>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {t('practice.scoreValue', {
                              score: attempt.score,
                              total: attempt.totalPoints,
                            })}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md border px-2 py-1">
                            {attempt.exerciseSet.course.title}
                          </span>
                          {attempt.exerciseSet.unit?.title && (
                            <span className="rounded-md border px-2 py-1">
                              {attempt.exerciseSet.unit.title}
                            </span>
                          )}
                          <span className="rounded-md border px-2 py-1">
                            {t('practice.attemptSubmittedAtValue', {
                              value: formatDateTime(attempt.submittedAt),
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
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
