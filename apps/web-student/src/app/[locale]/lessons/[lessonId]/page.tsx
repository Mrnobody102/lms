'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LessonHeader } from '../../../../components/lessons/lesson-header';
import { LessonSidebar } from '../../../../components/lessons/lesson-sidebar';
import { LessonContent } from '../../../../components/lessons/lesson-content';
import { LessonNavigation } from '../../../../components/lessons/lesson-navigation';
import { useLesson, useCourse } from '../../../../hooks/use-courses';
import {
  useCourseProgress,
  useRecordLessonActivity,
  useUpdateProgress,
} from '../../../../hooks/use-progress';
import { LearningActivityType, ProgressStatus } from '../../../../lib/progress-api';

export default function LessonPage() {
  const t = useTranslations('Student');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const params = useParams();

  const lessonParam = params.lessonId;
  const lessonId = (Array.isArray(lessonParam) ? lessonParam[0] : lessonParam) ?? '';

  const { data: currentLesson, isLoading: lessonLoading, error: lessonError } = useLesson(lessonId);
  const { data: course, isLoading: courseLoading } = useCourse(currentLesson?.courseId ?? '');
  const { data: progress = [] } = useCourseProgress(currentLesson?.courseId ?? '');
  const updateProgress = useUpdateProgress();
  const { mutate: recordLessonActivity } = useRecordLessonActivity();
  const trackedLessonIdRef = useRef<string | null>(null);

  const loading = lessonLoading || courseLoading;
  const error = lessonError?.message ?? null;

  useEffect(() => {
    if (!currentLesson || trackedLessonIdRef.current === currentLesson.id) {
      return;
    }

    trackedLessonIdRef.current = currentLesson.id;
    recordLessonActivity({
      lessonId: currentLesson.id,
      type: LearningActivityType.LESSON_OPENED,
    });
  }, [currentLesson, recordLessonActivity]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !currentLesson || !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 rounded-[2rem] bg-card border shadow-2xl max-w-md mx-auto animate-in fade-in zoom-in duration-500">
          <h1 className="text-3xl font-black mb-4 tracking-tighter">{t('lesson.error')}</h1>
          <p className="text-muted-foreground font-medium leading-relaxed">
            {error || t('lesson.notFoundDesc')}
          </p>
        </div>
      </div>
    );
  }

  const currentIndex = course.lessons?.findIndex((l) => l.id === currentLesson.id) ?? -1;
  const prevLesson = currentIndex > 0 ? (course.lessons?.[currentIndex - 1] ?? null) : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < (course.lessons?.length ?? 0) - 1
      ? (course.lessons?.[currentIndex + 1] ?? null)
      : null;

  const handleComplete = () => {
    updateProgress.mutate({
      lessonId: currentLesson.id,
      status: ProgressStatus.COMPLETED,
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/20">
      <LessonHeader
        course={course}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-background via-background to-primary/5 flex flex-col scroll-smooth">
          <LessonContent lesson={currentLesson} />
          <LessonNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onComplete={handleComplete}
            isCompleted={progress.some(
              (p) => p.lessonId === currentLesson.id && p.status === ProgressStatus.COMPLETED,
            )}
          />
        </main>

        <LessonSidebar
          course={course}
          currentLesson={currentLesson}
          progress={progress}
          isSidebarOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
