'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, BookOpenCheck, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getSafeCourseCoverUrl } from '@/lib/course-images';
import {
  getPublicCourses,
  getStudentPortalUrl,
  PublicCourseSummary,
} from '@/lib/public-course-api';
import { Link } from '@/navigation';
import { PublicCourseCard } from './public-course-card';

export function SalesHome() {
  const t = useTranslations('Sales');
  const locale = useLocale();
  const [courses, setCourses] = useState<PublicCourseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getPublicCourses({ limit: 3 })
      .then((response) => {
        if (isMounted) {
          setCourses(response.data);
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
  }, []);

  const heroImage = getSafeCourseCoverUrl(courses[0]?.coverImageUrl);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative flex min-h-[72vh] items-end overflow-hidden">
        <Image
          src={heroImage}
          alt={t('home.heroImageAlt')}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-14 pt-28 text-white">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-white/25 bg-white/10 px-3 py-1.5 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              {t('home.badge')}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{t('home.title')}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
              {t('home.subtitle')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-white/90"
              >
                {t('home.viewCourses')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={getStudentPortalUrl('/login', locale)}
                className="inline-flex h-12 items-center justify-center rounded-md border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {t('home.studentLogin')}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-background">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-3">
          <ValueItem
            icon={<BookOpenCheck className="h-5 w-5" />}
            title={t('home.valuePath')}
            text={t('home.valuePathDesc')}
          />
          <ValueItem
            icon={<GraduationCap className="h-5 w-5" />}
            title={t('home.valuePractice')}
            text={t('home.valuePracticeDesc')}
          />
          <ValueItem
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t('home.valueProgress')}
            text={t('home.valueProgressDesc')}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{t('home.courseEyebrow')}</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">{t('home.featuredTitle')}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t('home.featuredSubtitle')}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
          >
            {t('home.allCourses')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-[390px] animate-pulse rounded-md border bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            {t('home.loadError')}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-3">
            {courses.map((course) => (
              <PublicCourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border bg-card p-8 text-sm text-muted-foreground">
            {t('home.emptyCourses')}
          </div>
        )}
      </section>
    </main>
  );
}

function ValueItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-md border bg-card p-5">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
