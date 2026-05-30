'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCourse, useCreateLesson } from '@/hooks/use-courses';
import { Lesson } from '@/lib/course-api';
import { LessonEditor } from '@/features/courses/lesson-editor';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui';

export default function NewLessonPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const courseId = params.id as string;
  const initialUnitId = searchParams.get('unitId');

  const { data: course, isLoading } = useCourse(courseId);
  const createLesson = useCreateLesson();

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

  const existingLessonsCount = course.lessons?.length || 0;

  const handleSubmit = async (data: Partial<Lesson>) => {
    try {
      setError(null);
      await createLesson.mutateAsync({ courseId, data });
      router.push(`/courses/${courseId}/edit`);
      return true;
    } catch {
      setError(t('lessonAddError'));
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
            units={course.units}
            lessons={course.lessons}
            initialUnitId={initialUnitId}
            nextOrder={existingLessonsCount + 1}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            saving={createLesson.isPending}
          />
        </main>
      </div>
    </AuthGuard>
  );
}
