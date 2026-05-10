'use client';

import { CheckCircle2, PlayCircle, Circle, X } from 'lucide-react';
import { Link } from '../../navigation';
import { useTranslations } from 'next-intl';
import { Course, Lesson } from '../../lib/course-api';
import { UserLessonProgress, ProgressStatus } from '../../lib/progress-api';

interface LessonSidebarProps {
  course: Course;
  currentLesson: Lesson;
  progress: UserLessonProgress[];
  isSidebarOpen: boolean;
  onClose: () => void;
}

export function LessonSidebar({
  course,
  currentLesson,
  progress,
  isSidebarOpen,
  onClose,
}: LessonSidebarProps) {
  const t = useTranslations('Student');
  const completedLessons = progress.filter((p) => p.status === ProgressStatus.COMPLETED).length;
  const totalLessons = course.lessons?.length ?? 0;
  const completionPercentage =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const units = course.units ?? [];
  const groupedLessonIds = new Set(
    units.flatMap((unit) => (unit.lessons ?? []).map((lesson) => lesson.id)),
  );
  const ungroupedLessons = (course.lessons ?? []).filter(
    (lesson) => !lesson.unitId || !groupedLessonIds.has(lesson.id),
  );
  const lessonGroups =
    units.length > 0
      ? [
          ...units.map((unit) => ({
            id: unit.id,
            title: unit.title,
            lessons: unit.lessons ?? [],
          })),
          ...(ungroupedLessons.length > 0
            ? [{ id: 'ungrouped', title: t('lesson.ungrouped'), lessons: ungroupedLessons }]
            : []),
        ]
      : [{ id: 'all', title: null, lessons: course.lessons ?? [] }];

  return (
    <>
      <aside
        className={`
        fixed inset-0 z-[60] bg-background lg:relative lg:inset-auto lg:z-0
        w-full sm:w-[22rem] border-l flex flex-col shrink-0 transition-all duration-500 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:hidden lg:w-0'}
        ${!isSidebarOpen && 'lg:hidden shadow-none border-l-0'}
      `}
      >
        <div className="p-8 border-b space-y-6 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl uppercase tracking-tighter text-foreground/80">
              {t('lesson.curriculum')}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl lg:hidden border">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <span>
                {completionPercentage}% {t('lesson.completed').toUpperCase()}
              </span>
              <span>
                {completedLessons}/{totalLessons}
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {lessonGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              {group.title && (
                <div className="px-2 pt-4 pb-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  {group.title}
                </div>
              )}
              {group.lessons.map((lesson, idx) => (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  aria-current={lesson.id === currentLesson.id ? 'page' : undefined}
                  className={`
                    flex items-start gap-4 p-5 rounded-2xl transition-all duration-300 group relative overflow-hidden
                    ${
                      lesson.id === currentLesson.id
                        ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.02] z-10'
                        : 'hover:bg-muted border border-transparent hover:border-border'
                    }
                  `}
                >
                  <div className="pt-0.5 shrink-0 relative z-10">
                    {progress.some(
                      (p) => p.lessonId === lesson.id && p.status === ProgressStatus.COMPLETED,
                    ) ? (
                      <div
                        className={`rounded-lg p-1 ${lesson.id === currentLesson.id ? 'bg-white/20' : 'bg-emerald-500/10'}`}
                      >
                        <CheckCircle2
                          className={`w-5 h-5 ${lesson.id === currentLesson.id ? 'text-white' : 'text-emerald-500'}`}
                        />
                      </div>
                    ) : lesson.id === currentLesson.id ? (
                      <div className="rounded-lg p-1 bg-white/20 animate-pulse">
                        <PlayCircle className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="rounded-lg p-1 bg-muted group-hover:bg-background transition-colors">
                        <Circle className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-black uppercase tracking-[0.2em] ${lesson.id === currentLesson.id ? 'text-white/70' : 'text-muted-foreground'}`}
                      >
                        {t('lesson.part')} {idx + 1}
                      </span>
                      <span
                        className={`text-[9px] font-bold ${lesson.id === currentLesson.id ? 'text-white/70' : 'text-muted-foreground'}`}
                      >
                        {lesson.duration}m
                      </span>
                    </div>
                    <p
                      className={`text-sm font-black leading-tight tracking-tight ${lesson.id === currentLesson.id ? 'text-white' : 'text-foreground'}`}
                    >
                      {lesson.title}
                    </p>
                  </div>

                  {lesson.id === currentLesson.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 animate-[shimmer_2s_infinite]"></div>
                  )}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55] lg:hidden transition-opacity duration-500"
          onClick={onClose}
        />
      )}
    </>
  );
}
