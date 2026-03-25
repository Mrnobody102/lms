'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  useCourse,
  useUpdateCourse,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '@/hooks/use-courses';
import { CourseForm } from '@/features/courses/course-form';
import { LessonList } from '@/features/courses/lesson-list';
import { AddLessonDialog } from '@/features/courses/add-lesson-form';
import { EditLessonDialog } from '@/features/courses/edit-lesson-form';
import { CourseStats } from '@/features/courses/course-stats';
import { Lesson } from '@/lib/course-api';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function CourseEditorPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const courseId = params.id as string;

  const { data: course, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();

  const [showAddLesson, setShowAddLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localTitle, setLocalTitle] = useState('');

  useEffect(() => {
    if (course?.title) setLocalTitle(course.title);
  }, [course]);

  const showMsg = (type: 'success' | 'error', key: string) => {
    setMessage({ type, text: t(key) });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateCourse = () => {
    if (!course) return;
    updateCourse.mutate(
      { id: courseId, data: { title: localTitle } },
      {
        onSuccess: () => showMsg('success', 'courseSaved'),
        onError: () => showMsg('error', 'courseSaveError'),
      },
    );
  };

  const handleAddLesson = (data: Partial<Lesson>): Promise<boolean> => {
    return new Promise((resolve) => {
      createLesson.mutate(
        { courseId, data },
        {
          onSuccess: () => {
            showMsg('success', 'lessonAdded');
            resolve(true);
          },
          onError: () => {
            showMsg('error', 'lessonAddError');
            resolve(false);
          },
        },
      );
    });
  };

  const handleUpdateLesson = (data: Partial<Lesson>): Promise<boolean> => {
    if (!editingLesson) return Promise.resolve(false);
    return new Promise((resolve) => {
      updateLesson.mutate(
        { id: editingLesson.id, data, courseId },
        {
          onSuccess: () => {
            setEditingLesson(null);
            showMsg('success', 'lessonUpdated');
            resolve(true);
          },
          onError: () => {
            showMsg('error', 'lessonUpdateError');
            resolve(false);
          },
        },
      );
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    deleteLesson.mutate(
      { id: lessonId, courseId },
      {
        onSuccess: () => showMsg('success', 'lessonDeleted'),
        onError: () => showMsg('error', 'lessonDeleteError'),
      },
    );
  };

  const lessons = course?.lessons ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('loadEditor')}</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Course not found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {/* Back */}
            <Link
              href="/courses"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              {t('backToList')}
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">ID: {course.id}</p>
              </div>
              {lessons[0] && (
                <Link
                  href={`${process.env.NEXT_PUBLIC_WEB_STUDENT_URL || 'http://localhost:3000'}/vi/lessons/${lessons[0].id}`}
                  target="_blank"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="w-4 h-4" />
                    {t('previewFirstLesson')}
                  </Button>
                </Link>
              )}
            </div>

            {/* Toast */}
            {message && (
              <div
                className={`mb-4 flex items-center gap-2 p-3 rounded-lg border text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
                    : 'bg-destructive/5 border-destructive/20 text-destructive'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Course Info + Lessons */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border rounded-xl p-5">
                  <h2 className="text-base font-semibold mb-4">{t('basicInfo')}</h2>
                  <CourseForm
                    title={localTitle}
                    onTitleChange={setLocalTitle}
                    onSave={handleUpdateCourse}
                    saving={updateCourse.isPending}
                  />
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <LessonList
                    lessons={lessons}
                    onEdit={(lesson) => setEditingLesson(lesson)}
                    onDelete={handleDeleteLesson}
                    onAddClick={() => setShowAddLesson(true)}
                  />
                </div>
              </div>

              {/* Right: Stats */}
              <div className="space-y-4">
                <div className="bg-card border rounded-xl p-5">
                  <CourseStats lessons={lessons} />
                </div>
              </div>
            </div>
          </div>
        </main>

        <AddLessonDialog
          existingLessonsCount={lessons.length}
          onSubmit={handleAddLesson}
          open={showAddLesson}
          onOpenChange={setShowAddLesson}
          saving={createLesson.isPending}
        />
        <EditLessonDialog
          lesson={editingLesson}
          onSubmit={handleUpdateLesson}
          open={!!editingLesson}
          onOpenChange={(open) => {
            if (!open) setEditingLesson(null);
          }}
          saving={updateLesson.isPending}
        />
      </div>
    </AuthGuard>
  );
}
