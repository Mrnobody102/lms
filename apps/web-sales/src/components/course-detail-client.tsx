'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  KeyRound,
  LogIn,
  PlayCircle,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { getSafeCourseCoverUrl } from '@/lib/course-images';
import {
  getCourseLevelLabel,
  getPublicCourse,
  getStudentPortalUrl,
  PublicCourseDetail,
  PublicLessonPreview,
} from '@/lib/public-course-api';
import { Link } from '@/navigation';

export function CourseDetailClient({ courseId }: { courseId: string }) {
  const t = useTranslations('Sales');
  const locale = useLocale();
  const [course, setCourse] = useState<PublicCourseDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    getPublicCourse(courseId)
      .then((response) => {
        if (isMounted) {
          setCourse(response);
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
  }, [courseId]);

  const levelLabel = course ? getCourseLevelLabel(course) : null;
  const lessons = useMemo(() => {
    if (!course) return [];
    return [
      ...course.units.flatMap((unit) => unit.lessons),
      ...course.ungroupedLessons,
    ] satisfies PublicLessonPreview[];
  }, [course]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="h-[440px] animate-pulse rounded-md border bg-muted/40" />
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
            <div className="h-96 animate-pulse rounded-md border bg-muted/40" />
            <div className="h-72 animate-pulse rounded-md border bg-muted/40" />
          </div>
        </div>
      </main>
    );
  }

  if (isError || !course) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">{t('detail.loadErrorTitle')}</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{t('detail.loadError')}</p>
          <Link
            href="/courses"
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('detail.backToCourses')}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="relative min-h-[460px] overflow-hidden">
        <Image
          src={getSafeCourseCoverUrl(course.coverImageUrl)}
          alt={course.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto flex min-h-[460px] max-w-7xl flex-col justify-end px-6 pb-12 pt-24 text-white">
          <Link
            href="/courses"
            className="mb-8 inline-flex h-10 w-fit items-center gap-2 rounded-md border border-white/30 px-4 text-sm font-semibold hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('detail.backToCourses')}
          </Link>
          <div className="max-w-3xl">
            {levelLabel && <p className="mb-3 text-sm font-semibold text-white/80">{levelLabel}</p>}
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{course.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/85">
              {course.description || t('courseCard.noDescription')}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric
              icon={<BookOpen className="h-5 w-5" />}
              label={t('detail.lessons')}
              value={String(course.lessonCount)}
            />
            <Metric
              icon={<PlayCircle className="h-5 w-5" />}
              label={t('detail.units')}
              value={String(course.unitCount)}
            />
            <Metric
              icon={<Clock3 className="h-5 w-5" />}
              label={t('detail.duration')}
              value={t('detail.durationValue', { minutes: course.totalDuration })}
            />
          </div>

          <article className="rounded-md border bg-card p-6">
            <div className="mb-6">
              <p className="text-sm font-semibold text-primary">{t('detail.curriculumEyebrow')}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">{t('detail.curriculum')}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('detail.curriculumDesc')}
              </p>
            </div>

            <div className="space-y-4">
              {course.units.map((unit) => (
                <section key={unit.id} className="rounded-md border bg-background p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{unit.title}</h3>
                      {unit.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{unit.description}</p>
                      )}
                    </div>
                    <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                      {t('detail.lessonCount', { count: unit.lessons.length })}
                    </span>
                  </div>
                  <LessonPreviewList lessons={unit.lessons} />
                </section>
              ))}

              {course.ungroupedLessons.length > 0 && (
                <section className="rounded-md border bg-background p-4">
                  <h3 className="mb-3 font-semibold">{t('detail.ungrouped')}</h3>
                  <LessonPreviewList lessons={course.ungroupedLessons} />
                </section>
              )}

              {lessons.length === 0 && (
                <div className="rounded-md border bg-background p-5 text-sm text-muted-foreground">
                  {t('detail.emptyCurriculum')}
                </div>
              )}
            </div>
          </article>
        </div>

        <aside className="h-fit rounded-md border bg-card p-6 lg:sticky lg:top-6">
          <h2 className="text-xl font-bold tracking-tight">{t('detail.ctaTitle')}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t('detail.ctaDesc')}</p>
          <div className="mt-6 grid gap-3">
            <a
              href={getStudentPortalUrl('/login', locale)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <LogIn className="h-4 w-4" />
              {t('detail.loginCta')}
            </a>
            <a
              href={getStudentPortalUrl('/activation', locale)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
            >
              <KeyRound className="h-4 w-4" />
              {t('detail.activationCta')}
            </a>
          </div>
          <div className="mt-6 space-y-3 border-t pt-5">
            {[
              t('detail.benefitAccess'),
              t('detail.benefitPractice'),
              t('detail.benefitProgress'),
            ].map((item) => (
              <div key={item} className="flex gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function LessonPreviewList({ lessons }: { lessons: PublicLessonPreview[] }) {
  const t = useTranslations('Sales');

  if (lessons.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('detail.noLessons')}</p>;
  }

  return (
    <div className="divide-y rounded-md border">
      {lessons.map((lesson) => (
        <div key={lesson.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{lesson.title}</p>
            <p className="mt-1 text-xs uppercase text-muted-foreground">{lesson.type}</p>
          </div>
          <span className="shrink-0 text-sm text-muted-foreground">
            {t('detail.minuteValue', { minutes: lesson.duration })}
          </span>
        </div>
      ))}
    </div>
  );
}
