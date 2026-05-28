'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCourse, useUpdateLesson } from '@/hooks/use-courses';
import { Lesson } from '@/lib/course-api';
import { LessonEditor } from '@/features/courses/lesson-editor';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui';

export default function EditLessonPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const { data: course, isLoading } = useCourse(courseId);
  const updateLesson = useUpdateLesson();

  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('courseNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const lesson = course.lessons?.find((l) => l.id === lessonId);

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('lessonNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleSubmit = async (data: Partial<Lesson>) => {
    try {
      setError(null);
      await updateLesson.mutateAsync({ id: lessonId, courseId, data });
      router.push(`/courses/${courseId}/edit`);
      return true;
    } catch {
      setError(t('lessonUpdateError'));
      return false;
    }
  };

  const handleCancel = () => {
    router.push(`/courses/${courseId}/edit`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 relative bg-muted/20">
          {error && (
            <div className="max-w-4xl mx-auto mt-6 px-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}
          <LessonEditor
            courseId={courseId}
            lesson={lesson}
            units={course.units}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            saving={updateLesson.isPending}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
