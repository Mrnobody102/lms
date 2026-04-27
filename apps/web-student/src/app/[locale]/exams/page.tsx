'use client';

import { ArrowRight, BookOpen, FileCheck2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { useExams } from '@/hooks/use-exams';
import { Link } from '@/navigation';

export default function ExamsPage() {
  const t = useTranslations('Student');
  const { data: exams = [], isLoading, isError } = useExams();

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
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

        {isLoading ? (
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
        )}
      </main>
    </div>
  );
}
