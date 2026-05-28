'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getPublicCourses, PublicCourseListResponse } from '@/lib/public-course-api';
import { Link, useRouter } from '@/navigation';
import { PublicCourseCard } from './public-course-card';

const PAGE_SIZE = 12;

export function CoursesPageClient() {
  const t = useTranslations('Sales');
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(Number(searchParams.get('page') ?? '1') || 1, 1);
  const search = searchParams.get('search') ?? '';
  const [query, setQuery] = useState(search);
  const [courseData, setCourseData] = useState<PublicCourseListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPublicCourses({ page, limit: PAGE_SIZE, search: search || undefined })
      .then((response) => {
        if (isMounted) {
          setCourseData(response);
          setIsError(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsError(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, search]);

  useEffect(() => {
    setQuery(search);
  }, [search]);

  const pageHref = useMemo(() => {
    return (nextPage: number) => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (nextPage > 1) params.set('page', String(nextPage));
      const suffix = params.toString();
      return suffix ? `/courses?${suffix}` : '/courses';
    };
  }, [search]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const trimmed = query.trim();
    if (trimmed) params.set('search', trimmed);
    const suffix = params.toString();
    router.push(suffix ? `/courses?${suffix}` : '/courses');
  };

  const courses = courseData?.data ?? [];
  const meta = courseData?.meta;

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/"
            className="mb-7 inline-flex h-10 items-center gap-2 rounded-md border bg-background px-4 text-sm font-semibold hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('courses.backHome')}
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{t('courses.eyebrow')}</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">{t('courses.title')}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {t('courses.subtitle')}
              </p>
            </div>
            <form onSubmit={submitSearch} className="flex w-full gap-2 lg:w-[420px]">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('courses.searchPlaceholder')}
                  className="h-11 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary"
                />
              </div>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {t('courses.search')}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[390px] animate-pulse rounded-md border bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t('courses.loadError')}
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-md border bg-card p-8 text-sm text-muted-foreground">
            {search ? t('courses.emptySearch') : t('courses.empty')}
          </div>
        ) : (
          <>
            <div className="mb-5 text-sm text-muted-foreground">
              {t('courses.resultCount', { count: meta?.total ?? courses.length })}
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <PublicCourseCard key={course.id} course={course} />
              ))}
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between gap-3">
                <PaginationLink href={pageHref(Math.max(1, page - 1))} disabled={page <= 1}>
                  <ArrowLeft className="h-4 w-4" />
                  {t('courses.previous')}
                </PaginationLink>
                <span className="text-sm text-muted-foreground">
                  {t('courses.pageCount', { page: meta.page, totalPages: meta.totalPages })}
                </span>
                <PaginationLink
                  href={pageHref(Math.min(meta.totalPages, page + 1))}
                  disabled={page >= meta.totalPages}
                >
                  {t('courses.next')}
                  <ArrowRight className="h-4 w-4" />
                </PaginationLink>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function PaginationLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold text-muted-foreground opacity-50">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
    >
      {children}
    </Link>
  );
}
