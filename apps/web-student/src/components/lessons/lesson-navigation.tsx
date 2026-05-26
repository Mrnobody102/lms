'use client';

import { ChevronLeft, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
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
    <div className="mt-auto border-t bg-background/90 px-4 py-4 sticky bottom-0 backdrop-blur-xl shrink-0 z-40 shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Prev */}
        <div className="flex-shrink-0">
          {prevLesson ? (
            <Link
              href={`/lessons/${prevLesson.id}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-all hover:border-foreground/20 hover:bg-muted active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('lesson.prev')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className="flex items-center gap-2 rounded-xl border border-transparent bg-muted px-5 py-2.5 text-sm font-bold text-muted-foreground opacity-40 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('lesson.prev')}
            </span>
          )}
        </div>

        {/* Complete button */}
        <button
          onClick={onComplete}
          disabled={isCompleted}
          className={`group relative flex items-center justify-center gap-2 overflow-hidden rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
            isCompleted
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default shadow-none'
              : 'bg-emerald-500 text-white shadow-emerald-500/30 hover:bg-emerald-600'
          }`}
        >
          {!isCompleted && (
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          )}
          <CheckCircle2
            className={`relative z-10 h-4 w-4 ${!isCompleted && 'transition-transform group-hover:scale-110'}`}
          />
          <span className="relative z-10">
            {isCompleted ? t('lesson.completed') : t('lesson.complete')}
          </span>
        </button>

        {/* Next – only clickable after completing */}
        <div className="flex-shrink-0">
          {nextLesson ? (
            isCompleted ? (
              <Link
                href={`/lessons/${nextLesson.id}`}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90 hover:translate-x-0.5 active:scale-95"
              >
                {t('lesson.next')}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span
                title="Hoàn thành bài học để mở khóa"
                className="flex items-center gap-2 rounded-xl border border-border bg-muted px-5 py-2.5 text-sm font-bold text-muted-foreground opacity-50 cursor-not-allowed"
              >
                {t('lesson.next')}
                <Lock className="h-3.5 w-3.5" />
              </span>
            )
          ) : (
            <span
              aria-disabled="true"
              className="flex items-center gap-2 rounded-xl bg-muted px-5 py-2.5 text-sm font-bold text-muted-foreground opacity-40 cursor-not-allowed"
            >
              {t('lesson.next')}
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
