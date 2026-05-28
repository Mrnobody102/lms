'use client';

import Image from 'next/image';
import { ArrowRight, BookOpen, Clock3, Layers3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { getSafeCourseCoverUrl } from '@/lib/course-images';
import { getCourseLevelLabel, PublicCourseSummary } from '@/lib/public-course-api';

export function PublicCourseCard({ course }: { course: PublicCourseSummary }) {
  const t = useTranslations('Sales');
  const levelLabel = getCourseLevelLabel(course);

  return (
    <article className="group flex min-h-[390px] flex-col overflow-hidden rounded-md border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden bg-muted">
        <Image
          src={getSafeCourseCoverUrl(course.coverImageUrl)}
          alt={course.title}
          fill
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {levelLabel && (
            <span className="rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {levelLabel}
            </span>
          )}
          <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            {t('courseCard.published')}
          </span>
        </div>
        <h2 className="line-clamp-2 text-lg font-semibold tracking-tight">{course.title}</h2>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {course.description || t('courseCard.noDescription')}
        </p>
        <div className="mt-5 grid gap-2 text-sm text-muted-foreground">
          <CourseMeta
            icon={<BookOpen className="h-4 w-4" />}
            text={t('courseCard.lessons', { count: course.lessonCount })}
          />
          <CourseMeta
            icon={<Layers3 className="h-4 w-4" />}
            text={t('courseCard.units', { count: course.unitCount })}
          />
          <CourseMeta
            icon={<Clock3 className="h-4 w-4" />}
            text={t('courseCard.duration', { minutes: course.totalDuration })}
          />
        </div>
        <Link
          href={`/courses/${course.id}`}
          className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {t('courseCard.viewDetail')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function CourseMeta({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-primary">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
