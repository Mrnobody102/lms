'use client';

import { ArrowLeft, Menu, X, Flame } from 'lucide-react';
import { Link } from '../../navigation';
import { ThemeToggle, LanguageToggle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Course } from '../../lib/course-api';
import { useProgressSummary } from '../../hooks/use-progress';

interface LessonHeaderProps {
  course: Course;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

export function LessonHeader({ course, isSidebarOpen, toggleSidebar }: LessonHeaderProps) {
  const t = useTranslations('Student');
  const { data: progressSummary } = useProgressSummary();
  const streak = progressSummary?.totals?.currentStreak ?? 0;

  return (
    <header className="h-14 border-b bg-background/90 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-50">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={`/courses/${course.id}`}
          className="p-2 hover:bg-muted rounded-lg transition-all active:scale-90 text-muted-foreground hover:text-foreground border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={t('lesson.backToCourse')}
          title={t('lesson.backToCourse')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="h-7 w-[1px] bg-border hidden sm:block"></div>
        <div className="min-w-0">
          <h1 className="font-bold text-sm sm:text-base line-clamp-1 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            {course.title}
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium hidden sm:block">
            {t('lesson.totalLessons', { count: course.lessons?.length ?? 0 })} -{' '}
            {t('lesson.duration', { minutes: course.totalDuration ?? 0 })}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {streak > 0 && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-full font-bold text-sm border border-orange-500/20 mr-1"
            title={`${streak} Day Streak!`}
          >
            <Flame className="w-4 h-4 animate-pulse" />
            <span>{streak}</span>
          </div>
        )}
        <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
          <ThemeToggle label={t('themeToggle')} />
          <LanguageToggle />
        </div>
        <button
          onClick={toggleSidebar}
          className="flex h-11 w-11 items-center justify-center hover:bg-muted rounded-lg transition-all active:scale-90 border border-transparent hover:border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label={
            isSidebarOpen ? t('lesson.closeCurriculumSidebar') : t('lesson.openCurriculumSidebar')
          }
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
}
