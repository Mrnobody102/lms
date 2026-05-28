'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AuthRequiredPanel } from '../../../../components/auth/auth-required-panel';
import { LessonHeader } from '../../../../components/lessons/lesson-header';
import { LessonSidebar } from '../../../../components/lessons/lesson-sidebar';
import { LessonContent } from '../../../../components/lessons/lesson-content';
import { LessonNavigation } from '../../../../components/lessons/lesson-navigation';
import { CourseCertificatePanel } from '../../../../components/certificates/course-certificate-panel';
import { DiscussionPanel } from '../../../../components/discussions/discussion-panel';
import { useLesson, useCourse } from '../../../../hooks/use-courses';
import { useAuthStore } from '../../../../features/auth/auth.store';
import {
  useCourseProgress,
  useRecordLessonActivity,
  useUpdateProgress,
} from '../../../../hooks/use-progress';
import {
  LearningActivityType,
  ProgressStatus,
  type UserLessonProgress,
} from '../../../../lib/progress-api';
import { getApiErrorMessage } from '@/lib/api-error';

type CompletionFeedback = { kind: 'success' | 'error'; message: string };

export default function LessonPage() {
  const t = useTranslations('Student');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [optimisticCompletedLessonId, setOptimisticCompletedLessonId] = useState<string | null>(
    null,
  );
  const [completionFeedback, setCompletionFeedback] = useState<CompletionFeedback | null>(null);

  useEffect(() => {
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (!isDesktop) {
      setIsSidebarOpen(false);
      return;
    }

    const saved = localStorage.getItem('lms_sidebar_open');
    setIsSidebarOpen(saved === null ? true : saved === 'true');
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('lms_sidebar_open', String(next));
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
    localStorage.setItem('lms_sidebar_open', 'false');
  };
  const params = useParams();

  const lessonParam = params.lessonId;
  const lessonId = (Array.isArray(lessonParam) ? lessonParam[0] : lessonParam) ?? '';
  const canLoadProtectedLesson = isInitialized && isAuthenticated;

  const {
    data: currentLesson,
    isLoading: lessonLoading,
    error: lessonError,
  } = useLesson(lessonId, canLoadProtectedLesson);
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(
    currentLesson?.courseId ?? '',
    canLoadProtectedLesson && Boolean(currentLesson?.courseId),
  );
  const { data: progress = [] } = useCourseProgress(
    currentLesson?.courseId ?? '',
    canLoadProtectedLesson && Boolean(currentLesson?.courseId),
  );
  const updateProgress = useUpdateProgress();
  const { mutate: recordLessonActivity } = useRecordLessonActivity();
  const trackedLessonIdRef = useRef<string | null>(null);

  const loading = !isInitialized || (canLoadProtectedLesson && (lessonLoading || courseLoading));
  const hasError = Boolean(lessonError || courseError);

  useEffect(() => {
    if (
      !canLoadProtectedLesson ||
      !currentLesson ||
      trackedLessonIdRef.current === currentLesson.id
    ) {
      return;
    }

    trackedLessonIdRef.current = currentLesson.id;
    recordLessonActivity({
      lessonId: currentLesson.id,
      type: LearningActivityType.LESSON_OPENED,
    });
  }, [canLoadProtectedLesson, currentLesson, recordLessonActivity]);

  useEffect(() => {
    setOptimisticCompletedLessonId(null);
    setCompletionFeedback(null);
  }, [currentLesson?.id]);

  if (isInitialized && !isAuthenticated) {
    return (
      <div className="h-screen bg-background">
        <main className="flex h-full items-center justify-center p-6">
          <AuthRequiredPanel returnTo={'/lessons/' + lessonId} />
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (hasError || !currentLesson || !course) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center p-8 rounded-[2rem] bg-card border shadow-2xl max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl font-black mb-4 tracking-tighter">{t('lesson.notFound')}</h1>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {hasError ? t('lesson.loadError') : t('lesson.notFoundDesc')}
            </p>
          </div>
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
  const serverCompleted = progress.some(
    (p) => p.lessonId === currentLesson.id && p.status === ProgressStatus.COMPLETED,
  );
  const isOptimisticallyCompleted = optimisticCompletedLessonId === currentLesson.id;
  const isCompleted = serverCompleted || isOptimisticallyCompleted;
  const displayProgress: UserLessonProgress[] =
    isOptimisticallyCompleted && !serverCompleted
      ? [
          ...progress,
          {
            id: `optimistic-${currentLesson.id}`,
            lessonId: currentLesson.id,
            status: ProgressStatus.COMPLETED,
            updatedAt: new Date().toISOString(),
          },
        ]
      : progress;

  const handleComplete = () => {
    if (isCompleted || updateProgress.isPending) {
      return;
    }

    setOptimisticCompletedLessonId(currentLesson.id);
    setCompletionFeedback(null);
    updateProgress.mutate(
      {
        lessonId: currentLesson.id,
        status: ProgressStatus.COMPLETED,
      },
      {
        onSuccess: () => {
          setCompletionFeedback({ kind: 'success', message: t('lesson.progressSaved') });
        },
        onError: (error) => {
          setOptimisticCompletedLessonId(null);
          setCompletionFeedback({
            kind: 'error',
            message: getApiErrorMessage(error, t('lesson.progressSaveError')),
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden selection:bg-primary/20">
      <LessonHeader
        course={course}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={handleToggleSidebar}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-background via-background to-primary/5 flex flex-col scroll-smooth">
          <LessonContent lesson={currentLesson} onComplete={handleComplete} />
          <LessonNavigation
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onComplete={handleComplete}
            isCompleted={isCompleted}
            isCompleting={updateProgress.isPending}
          />
          {completionFeedback ? (
            <div className="mx-auto mb-4 w-full max-w-5xl px-4 sm:px-6 lg:px-10">
              <div
                role="status"
                className={`rounded-md border px-4 py-3 text-sm font-medium ${
                  completionFeedback.kind === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-destructive/20 bg-destructive/10 text-destructive'
                }`}
              >
                {completionFeedback.message}
              </div>
            </div>
          ) : null}
          <div className="mx-auto mb-10 w-full max-w-5xl px-4 sm:px-6 lg:px-10">
            <CourseCertificatePanel courseId={currentLesson.courseId} />
          </div>
          <DiscussionPanel targetType="LESSON" lessonId={currentLesson.id} />
        </main>

        <LessonSidebar
          course={course}
          currentLesson={currentLesson}
          progress={displayProgress}
          isSidebarOpen={isSidebarOpen}
          onClose={handleCloseSidebar}
        />
      </div>
    </div>
  );
}
