'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import {
  useCourse,
  useUpdateCourse,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
} from '@/hooks/use-courses';
import { CourseForm } from '@/components/courses/course-form';
import { LessonList } from '@/components/courses/lesson-list';
import { AddLessonForm } from '@/components/courses/add-lesson-form';
import { EditLessonForm } from '@/components/courses/edit-lesson-form';
import { CourseStats } from '@/components/courses/course-stats';
import { Lesson } from '@/lib/course-api';
import { ArrowLeft, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
    if (course?.title) {
      setLocalTitle(course.title);
    }
  }, [course]);

  const handleUpdateCourse = () => {
    if (!course) return;
    updateCourse.mutate(
      { id: courseId, data: { title: localTitle } },
      {
        onSuccess: () => {
          setMessage({ type: 'success', text: t('courseSaved') });
          setTimeout(() => setMessage(null), 3000);
        },
        onError: () => {
          setMessage({ type: 'error', text: t('courseSaveError') });
          setTimeout(() => setMessage(null), 3000);
        },
      },
    );
  };

  const handleAddLesson = (data: Partial<Lesson>): Promise<boolean> => {
    return new Promise((resolve) => {
      createLesson.mutate(
        { courseId, data },
        {
          onSuccess: () => {
            setShowAddLesson(false);
            setMessage({ type: 'success', text: t('lessonAdded') });
            setTimeout(() => setMessage(null), 3000);
            resolve(true);
          },
          onError: () => {
            setMessage({ type: 'error', text: t('lessonAddError') });
            setTimeout(() => setMessage(null), 3000);
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
            setMessage({ type: 'success', text: t('lessonUpdated') });
            setTimeout(() => setMessage(null), 3000);
            resolve(true);
          },
          onError: () => {
            setMessage({ type: 'error', text: t('lessonUpdateError') });
            setTimeout(() => setMessage(null), 3000);
            resolve(false);
          },
        },
      );
    });
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!confirm(t('confirmDeleteLesson'))) return;
    deleteLesson.mutate(
      { id: lessonId, courseId },
      {
        onSuccess: () => {
          setMessage({ type: 'success', text: t('lessonDeleted') });
          setTimeout(() => setMessage(null), 3000);
        },
        onError: () => {
          setMessage({ type: 'error', text: t('lessonDeleteError') });
          setTimeout(() => setMessage(null), 3000);
        },
      },
    );
  };

  const lessons = course?.lessons ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="font-black text-sm uppercase tracking-widest opacity-50">{t('loadEditor')}</p>
      </div>
    );
  }

  if (!course) return <div className="p-20 text-center font-black">Course not found.</div>;

  return (
    <div className="min-h-screen font-sans flex bg-background/50">
      <AdminSidebar />

      <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/courses"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 font-bold text-sm group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            {t('courses')}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
            <AdminHeader title={course.title} description={`ID: ${course.id}`} />
            {lessons[0] ? (
              <Link
                href={`${process.env.NEXT_PUBLIC_WEB_STUDENT_URL || 'http://localhost:3000'}/vi/lessons/${lessons[0].id}`}
                target="_blank"
                className="px-6 py-3 bg-white border border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-muted transition-all active:scale-95 flex items-center gap-2 shadow-sm shrink-0"
              >
                {t('previewFirstLesson')}
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="px-6 py-3 bg-muted border border-border/50 rounded-2xl font-black text-xs uppercase tracking-widest opacity-40 flex items-center gap-2 shadow-sm shrink-0 cursor-not-allowed">
                {t('noLessons')}
              </span>
            )}
          </div>

          {message && (
            <div
              className={`mb-8 p-6 rounded-3xl border flex items-center gap-4 animate-in slide-in-from-top duration-500 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                  : 'bg-destructive/10 border-destructive/20 text-destructive'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
              <p className="font-black text-sm">{message.text}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left side: Course info + lessons */}
            <div className="lg:col-span-2 space-y-12">
              <CourseForm
                title={localTitle}
                onTitleChange={setLocalTitle}
                onSave={handleUpdateCourse}
                saving={updateCourse.isPending}
              />

              <LessonList
                lessons={lessons}
                onEdit={(lesson) => {
                  setEditingLesson(lesson);
                  setShowAddLesson(false);
                }}
                onDelete={handleDeleteLesson}
                onAddClick={() => {
                  setShowAddLesson(true);
                  setEditingLesson(null);
                }}
              />
            </div>

            {/* Right side: Sidebar panels */}
            <div className="space-y-8">
              {showAddLesson && (
                <AddLessonForm
                  existingLessonsCount={lessons.length}
                  onSubmit={handleAddLesson}
                  onCancel={() => setShowAddLesson(false)}
                  saving={createLesson.isPending}
                />
              )}

              {editingLesson && (
                <EditLessonForm
                  lesson={editingLesson}
                  onSubmit={handleUpdateLesson}
                  onCancel={() => setEditingLesson(null)}
                  saving={updateLesson.isPending}
                />
              )}

              <CourseStats lessons={lessons} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
