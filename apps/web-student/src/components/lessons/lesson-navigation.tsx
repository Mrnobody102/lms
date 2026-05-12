'use client';

import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Link } from '../../navigation';
import { useTranslations } from 'next-intl';
import { Lesson } from '../../lib/course-api';

interface LessonNavigationProps {
  prevLesson: Lesson | null;
  nextLesson: Lesson | null;
  onComplete: () => void;
  isCompleted: boolean;
}

export function LessonNavigation({
  prevLesson,
  nextLesson,
  onComplete,
  isCompleted,
}: LessonNavigationProps) {
  const t = useTranslations('Student');

  return (
    <div className="mt-auto border-t bg-background/80 px-6 py-6 sticky bottom-0 backdrop-blur-xl shrink-0 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex gap-4 w-full sm:w-auto">
          {prevLesson ? (
            <Link
              href={`/lessons/${prevLesson.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border bg-card px-8 py-4 font-black text-foreground transition-all hover:border-foreground/20 hover:bg-muted active:scale-95 sm:flex-none"
            >
              <ChevronLeft className="h-5 w-5" />
              {t('lesson.prev')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md border border-transparent bg-muted px-8 py-4 font-black text-muted-foreground opacity-40 sm:flex-none"
            >
              <ChevronLeft className="h-5 w-5" />
              {t('lesson.prev')}
            </span>
          )}
          {nextLesson ? (
            <Link
              href={`/lessons/${nextLesson.id}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-8 py-4 font-black text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:translate-x-1 hover:opacity-95 active:scale-95 sm:flex-none"
            >
              {t('lesson.next')}
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-muted px-8 py-4 font-black text-muted-foreground opacity-40 sm:flex-none"
            >
              {t('lesson.next')}
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </div>

        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-md px-10 py-4 font-black shadow-2xl transition-all active:scale-95 sm:w-auto ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default shadow-none dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
              : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600'
          }`}
        >
          {!isCompleted && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          )}
          <CheckCircle2
            className={`relative z-10 h-5 w-5 ${!isCompleted && 'transition-transform group-hover:scale-110'}`}
          />
          <span className="relative z-10">
            {isCompleted ? t('lesson.completed') : t('lesson.complete')}
          </span>
        </button>
      </div>
    </div>
  );
}
