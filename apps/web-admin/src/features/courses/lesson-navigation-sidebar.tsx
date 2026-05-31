'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Lesson, CourseUnit } from '@/lib/course-api';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Menu,
  Video,
  PlayCircle,
  Layers,
  CheckSquare,
  PlusCircle,
} from 'lucide-react';
import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@repo/ui';

interface LessonNavigationSidebarProps {
  courseId: string;
  lessons: Lesson[];
  units: CourseUnit[];
  activeLessonId?: string;
}

export function LessonNavigationSidebar({
  courseId,
  lessons,
  units,
  activeLessonId,
}: LessonNavigationSidebarProps) {
  const t = useTranslations('Admin');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'quiz':
      case 'exam':
      case 'practice':
        return <CheckSquare className="w-4 h-4" />;
      case 'simulation':
      case 'micro_card':
        return <PlayCircle className="w-4 h-4" />;
      case 'text':
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);
  const unassignedLessons = lessons.filter((l) => !l.unitId).sort((a, b) => a.order - b.order);

  const navigationContent = (
    <>
      <div className="p-4 border-b flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-sm truncate">{t('lessonNavigationTitle')}</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="hidden h-8 w-8 lg:inline-flex"
          title={t('collapseSidebar')}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="flex flex-col gap-1">
          <Link
            href={`/courses/${courseId}/lessons/new`}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 px-2 py-2 rounded-md transition-colors mb-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('addLesson')}</span>
          </Link>
        </div>

        {sortedUnits.map((unit) => {
          const unitLessons = lessons
            .filter((l) => l.unitId === unit.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={unit.id} className="space-y-1">
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5" />
                <span className="truncate">{unit.title}</span>
              </div>

              {unitLessons.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground/60 italic pl-7">
                  {t('noLessonsInUnit')}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {unitLessons.map((lesson) => {
                    const isActive = lesson.id === activeLessonId;
                    return (
                      <Link
                        key={lesson.id}
                        href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                        className={`flex items-start gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <div
                          className={`mt-0.5 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          {getLessonIcon(lesson.type)}
                        </div>
                        <span className="line-clamp-2 leading-snug">{lesson.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {unassignedLessons.length > 0 && (
          <div className="space-y-1 mt-4">
            <div className="px-2 py-1 text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {t('unassignedLessons')}
            </div>
            <div className="space-y-0.5">
              {unassignedLessons.map((lesson) => {
                const isActive = lesson.id === activeLessonId;
                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                    className={`flex items-start gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getLessonIcon(lesson.type)}</div>
                    <span className="line-clamp-2">{lesson.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const mobileNavigation = (
    <div className="fixed bottom-4 right-4 z-40 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-11 rounded-full shadow-lg">
            <Menu className="mr-2 h-4 w-4" />
            {t('lessonNavigationTitle')}
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="flex w-[320px] max-w-[92vw] flex-col p-0">
          <SheetTitle className="sr-only">{t('lessonNavigationTitle')}</SheetTitle>
          {navigationContent}
        </SheetContent>
      </Sheet>
    </div>
  );

  if (isCollapsed) {
    return (
      <>
        {mobileNavigation}
        <div className="hidden h-full w-12 shrink-0 flex-col items-center border-l bg-background py-4 transition-all duration-300 lg:flex">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            title={t('expandSidebar')}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      {mobileNavigation}
      <div className="hidden h-full w-64 shrink-0 flex-col border-l bg-background transition-all duration-300 lg:flex xl:w-72">
        {navigationContent}
      </div>
    </>
  );
}
