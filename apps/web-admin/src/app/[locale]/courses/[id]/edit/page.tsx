'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { DraftPreviewCard } from '@/components/authoring/draft-preview-card';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  useCourse,
  useCourseReport,
  useBulkEnrollStudents,
  useBulkUnenrollStudents,
  useUpdateCourse,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useEnrollStudent,
  useUnenrollStudent,
  useCreateCourseUnit,
  useUpdateCourseUnit,
  useDeleteCourseUnit,
} from '@/hooks/use-courses';
import { CourseForm } from '@/features/courses/course-form';
import { LessonList } from '@/features/courses/lesson-list';
import { AddLessonDialog } from '@/features/courses/add-lesson-form';
import { EditLessonDialog } from '@/features/courses/edit-lesson-form';
import { CourseStats } from '@/features/courses/course-stats';
import { CourseReportPanel } from '@/features/courses/course-report-panel';
import { EnrollmentPanel } from '@/features/courses/enrollment-panel';
import {
  createEmptyQuizDraft,
  isLessonDraftReady,
  parseMicroCardContent,
  parseQuizContent,
} from '@/features/courses/lesson-type-fields';
import {
  CourseUnit,
  Lesson,
  buildCourseAiSettings,
  normalizeCourseAiSettings,
} from '@/lib/course-api';
import { Button, Alert, AlertDescription } from '@/components/ui';
import { ArrowLeft, ExternalLink, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from '@/navigation';

const EMPTY_ARRAY: never[] = [];

export default function CourseEditorPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const courseId = params.id as string;

  const { data: course, isLoading } = useCourse(courseId);
  const { data: report, isLoading: reportLoading } = useCourseReport(courseId);
  const updateCourse = useUpdateCourse();
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  const enrollStudent = useEnrollStudent();
  const unenrollStudent = useUnenrollStudent();
  const bulkEnrollStudents = useBulkEnrollStudents();
  const bulkUnenrollStudents = useBulkUnenrollStudents();
  const createCourseUnit = useCreateCourseUnit();
  const updateCourseUnit = useUpdateCourseUnit();
  const deleteCourseUnit = useDeleteCourseUnit();

  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localLevelId, setLocalLevelId] = useState<string>('');
  const [localAiEnabled, setLocalAiEnabled] = useState(false);
  const [localAiPrompt, setLocalAiPrompt] = useState('');

  useEffect(() => {
    if (!course) return;

    setLocalTitle(course.title);
    setLocalLevelId(course.levelId || '');
    const aiSettings = normalizeCourseAiSettings(course.aiSettings);
    setLocalAiEnabled(aiSettings.enabled);
    setLocalAiPrompt(aiSettings.prompt);
  }, [course]);

  const showMsg = (
    type: 'success' | 'error',
    key: string,
    values?: Record<string, string | number>,
  ) => {
    setMessage({ type, text: t(key, values) });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateCourse = () => {
    if (!course) return;
    updateCourse.mutate(
      {
        id: courseId,
        data: {
          title: localTitle,
          levelId: localLevelId || undefined,
          aiSettings: buildCourseAiSettings(localAiEnabled, localAiPrompt),
        },
      },
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

  const handleAddLessonClick = (unitId?: string | null) => {
    setSelectedUnitId(unitId ?? null);
    setShowAddLesson(true);
  };

  const handleDuplicateLesson = async (lesson: Lesson): Promise<void> => {
    const siblings = lessonsForUnit(lessons, lesson.unitId);
    const nextOrder = lesson.order + 1;
    const laterLessons = siblings.filter((item) => item.order > lesson.order);

    try {
      if (laterLessons.length > 0) {
        await Promise.all(
          laterLessons.map((item) =>
            updateLesson.mutateAsync({
              id: item.id,
              courseId,
              data: { order: item.order + 1 },
            }),
          ),
        );
      }

      const { id: _id, courseId: _lessonCourseId, ...copy } = lesson;
      await createLesson.mutateAsync({
        courseId,
        data: {
          ...copy,
          title: t('duplicatedLessonTitle', { title: lesson.title }),
          order: nextOrder,
          unitId: lesson.unitId ?? null,
          content: lesson.content ?? null,
          videoUrl: lesson.videoUrl ?? null,
          aiPrompt: lesson.aiPrompt ?? null,
          quiz: lesson.quiz ?? null,
        },
      });
      showMsg('success', 'lessonDuplicated');
    } catch {
      showMsg('error', 'lessonDuplicateError');
    }
  };

  const handleReorderLesson = async (activeId: string, overId: string) => {
    if (activeId === overId) return;

    const lesson = lessons.find((item) => item.id === activeId);
    if (!lesson) return;

    const siblings = lessonsForUnit(lessons, lesson.unitId).sort((a, b) => a.order - b.order);
    const oldIndex = siblings.findIndex((item) => item.id === activeId);
    const newIndex = siblings.findIndex((item) => item.id === overId);

    if (oldIndex < 0 || newIndex < 0) return;

    // To prevent rapid successive updates causing a race condition in optimistic UI,
    // we'll send a bulk update or sequentially update the affected items.
    // For simplicity, we can update the order of all items between oldIndex and newIndex.
    const newOrder = [...siblings];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    try {
      // Reassign orders based on new index
      await Promise.all(
        newOrder.map((item, index) => {
          if (item.order !== index) {
            return updateLesson.mutateAsync({
              id: item.id,
              courseId,
              data: { order: index },
            });
          }
          return Promise.resolve();
        }),
      );
      showMsg('success', 'lessonReordered');
    } catch {
      showMsg('error', 'lessonReorderError');
    }
  };

  const getLessonPreviewUrl = (lesson: Lesson) =>
    studentBaseUrl ? `${studentBaseUrl}/vi/lessons/${lesson.id}` : null;

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

  const handleBulkDeleteLessons = async (lessonIds: string[]): Promise<void> => {
    try {
      await Promise.all(lessonIds.map((id) => deleteLesson.mutateAsync({ id, courseId })));
      showMsg('success', 'lessonsDeleted');
    } catch {
      showMsg('error', 'lessonDeleteError');
      throw new Error('Failed to delete selected lessons');
    }
  };

  const handleEnrollStudent = async (userId: string): Promise<boolean> => {
    try {
      await enrollStudent.mutateAsync({ courseId, userId });
      showMsg('success', 'studentEnrolled');
      return true;
    } catch {
      showMsg('error', 'studentEnrollError');
      return false;
    }
  };

  const handleUnenrollStudent = async (userId: string): Promise<boolean> => {
    try {
      await unenrollStudent.mutateAsync({ courseId, userId });
      showMsg('success', 'studentUnenrolled');
      return true;
    } catch {
      showMsg('error', 'studentUnenrollError');
      return false;
    }
  };

  const handleBulkEnrollStudents = async (userIds: string[]): Promise<boolean> => {
    try {
      const result = await bulkEnrollStudents.mutateAsync({ courseId, userIds });
      showMsg('success', 'studentsEnrolled', {
        processed: result.processedCount,
        duplicate: result.duplicateCount,
      });
      return true;
    } catch {
      showMsg('error', 'studentsEnrollError');
      return false;
    }
  };

  const handleBulkUnenrollStudents = async (userIds: string[]): Promise<boolean> => {
    try {
      const result = await bulkUnenrollStudents.mutateAsync({ courseId, userIds });
      showMsg('success', 'studentsUnenrolled', {
        processed: result.processedCount,
        skipped: result.skippedCount,
      });
      return true;
    } catch {
      showMsg('error', 'studentsUnenrollError');
      return false;
    }
  };

  const handleAddUnit = (data: { title: string; order?: number }): Promise<boolean> => {
    return new Promise((resolve) => {
      createCourseUnit.mutate(
        { courseId, data },
        {
          onSuccess: () => {
            showMsg('success', 'unitAdded');
            resolve(true);
          },
          onError: () => {
            showMsg('error', 'unitSaveError');
            resolve(false);
          },
        },
      );
    });
  };

  const handleUpdateUnit = (
    unitId: string,
    data: { title?: string; order?: number },
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      updateCourseUnit.mutate(
        { courseId, unitId, data },
        {
          onSuccess: () => {
            showMsg('success', 'unitUpdated');
            resolve(true);
          },
          onError: () => {
            showMsg('error', 'unitSaveError');
            resolve(false);
          },
        },
      );
    });
  };

  const handleDuplicateUnit = async (unit: CourseUnit): Promise<void> => {
    try {
      const duplicate = await createCourseUnit.mutateAsync({
        courseId,
        data: {
          title: t('duplicatedUnitTitle', { title: unit.title }),
          order: unit.order + 1,
        },
      });

      const unitLessons = lessonsForUnit(lessons, unit.id);
      if (unitLessons.length > 0) {
        await Promise.all(
          unitLessons.map((lesson) =>
            createLesson.mutateAsync({
              courseId,
              data: {
                title: t('duplicatedLessonTitle', { title: lesson.title }),
                type: lesson.type,
                duration: lesson.duration,
                order: lesson.order,
                unitId: duplicate.id,
                content: lesson.content ?? null,
                videoUrl: lesson.videoUrl ?? null,
                aiPrompt: lesson.aiPrompt ?? null,
                quiz: lesson.quiz ?? null,
              },
            }),
          ),
        );
      }

      const laterUnits = units.filter((item) => item.order > unit.order);
      if (laterUnits.length > 0) {
        await Promise.all(
          laterUnits.map((item) =>
            updateCourseUnit.mutateAsync({
              courseId,
              unitId: item.id,
              data: { order: item.order + 1 },
            }),
          ),
        );
      }

      showMsg('success', 'unitDuplicated');
    } catch {
      showMsg('error', 'unitDuplicateError');
    }
  };

  const handleReorderUnit = async (activeId: string, overId: string) => {
    if (activeId === overId) return;

    const unit = units.find((item) => item.id === activeId);
    if (!unit) return;

    const orderedUnits = [...units].sort((a, b) => a.order - b.order);
    const oldIndex = orderedUnits.findIndex((item) => item.id === activeId);
    const newIndex = orderedUnits.findIndex((item) => item.id === overId);

    if (oldIndex < 0 || newIndex < 0) return;

    const newOrder = [...orderedUnits];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    try {
      await Promise.all(
        newOrder.map((item, index) => {
          if (item.order !== index) {
            return updateCourseUnit.mutateAsync({
              courseId,
              unitId: item.id,
              data: { order: index },
            });
          }
          return Promise.resolve();
        }),
      );
      showMsg('success', 'unitReordered');
    } catch {
      showMsg('error', 'unitReorderError');
    }
  };

  const handleDeleteUnit = (unitId: string) => {
    deleteCourseUnit.mutate(
      { courseId, unitId },
      {
        onSuccess: () => showMsg('success', 'unitDeleted'),
        onError: () => showMsg('error', 'unitDeleteError'),
      },
    );
  };

  const lessons = course?.lessons ?? EMPTY_ARRAY;
  const units = course?.units ?? EMPTY_ARRAY;
  const enrollments = course?.enrollments ?? EMPTY_ARRAY;
  const studentBaseUrl = process.env.NEXT_PUBLIC_WEB_STUDENT_URL;
  const firstLessonPreviewUrl =
    studentBaseUrl && lessons[0] ? getLessonPreviewUrl(lessons[0]) : null;
  const lessonReadiness = useMemo(() => {
    const readyLessons = lessons.filter(isPersistedLessonReady).length;
    return {
      totalLessons: lessons.length,
      totalUnits: units.length,
      readyLessons,
      draftLessons: lessons.length - readyLessons,
      isReady:
        Boolean(course?.title?.trim()) && lessons.length > 0 && readyLessons === lessons.length,
    };
  }, [course?.title, lessons, units.length]);

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
              {firstLessonPreviewUrl && (
                <a
                  href={firstLessonPreviewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <ExternalLink className="w-4 h-4" />
                    {t('previewFirstLesson')}
                  </Button>
                </a>
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
                    levelId={localLevelId}
                    onLevelIdChange={setLocalLevelId}
                    aiEnabled={localAiEnabled}
                    onAiEnabledChange={setLocalAiEnabled}
                    aiPrompt={localAiPrompt}
                    onAiPromptChange={setLocalAiPrompt}
                    onSave={handleUpdateCourse}
                    saving={updateCourse.isPending}
                  />
                </div>

                <div className="bg-card border rounded-xl p-5">
                  <LessonList
                    lessons={lessons}
                    units={units}
                    onEdit={(lesson) => setEditingLesson(lesson)}
                    onDelete={handleDeleteLesson}
                    onAddClick={handleAddLessonClick}
                    onAddUnit={handleAddUnit}
                    onUpdateUnit={handleUpdateUnit}
                    onDeleteUnit={handleDeleteUnit}
                    onDuplicateUnit={handleDuplicateUnit}
                    onReorderUnit={handleReorderUnit}
                    onReorder={handleReorderLesson}
                    onDuplicate={handleDuplicateLesson}
                    onBulkDelete={handleBulkDeleteLessons}
                    getPreviewUrl={getLessonPreviewUrl}
                  />
                </div>
              </div>

              {/* Right: Stats */}
              <div className="space-y-4">
                <DraftPreviewCard
                  title={t('courseReadiness')}
                  ready={lessonReadiness.isReady}
                  rows={[
                    { label: t('courseName'), value: course.title },
                    { label: t('unit'), value: lessonReadiness.totalUnits },
                    { label: t('totalLectures'), value: lessonReadiness.totalLessons },
                    { label: t('readyLessons'), value: lessonReadiness.readyLessons },
                    { label: t('draftLessons'), value: lessonReadiness.draftLessons },
                  ]}
                  checklist={[
                    { label: t('courseName'), ok: Boolean(course.title.trim()) },
                    { label: t('readyLessons'), ok: lessonReadiness.totalLessons > 0 },
                    { label: t('allLessonsReady'), ok: lessonReadiness.draftLessons === 0 },
                  ]}
                />
                <div className="bg-card border rounded-xl p-5">
                  <CourseStats lessons={lessons} />
                </div>
                <div className="bg-card border rounded-xl p-5">
                  <CourseReportPanel report={report} loading={reportLoading} />
                </div>
                <div className="bg-card border rounded-xl p-5">
                  <EnrollmentPanel
                    courseId={courseId}
                    enrollments={enrollments}
                    enrolling={enrollStudent.isPending}
                    unenrolling={unenrollStudent.isPending}
                    bulkEnrolling={bulkEnrollStudents.isPending}
                    bulkUnenrolling={bulkUnenrollStudents.isPending}
                    onEnroll={handleEnrollStudent}
                    onUnenroll={handleUnenrollStudent}
                    onBulkEnroll={handleBulkEnrollStudents}
                    onBulkUnenroll={handleBulkUnenrollStudents}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <AddLessonDialog
          existingLessonsCount={lessons.length}
          units={units}
          selectedUnitId={selectedUnitId}
          onSubmit={handleAddLesson}
          open={showAddLesson}
          onOpenChange={setShowAddLesson}
          saving={createLesson.isPending}
        />
        <EditLessonDialog
          lesson={editingLesson}
          units={units}
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

function lessonsForUnit(lessons: Lesson[], unitId?: string | null) {
  return lessons
    .filter((lesson) => (lesson.unitId ?? null) === (unitId ?? null))
    .sort((a, b) => a.order - b.order);
}

function isPersistedLessonReady(lesson: Lesson) {
  if (!lesson.title.trim()) return false;

  if (lesson.type === 'video') {
    return Boolean(lesson.videoUrl?.trim());
  }

  if (lesson.type === 'text') {
    return Boolean(lesson.content?.trim());
  }

  if (lesson.type === 'simulation') {
    return Boolean(lesson.aiPrompt?.trim());
  }

  if (lesson.type === 'micro_card') {
    const card = parseMicroCardContent(lesson.content);
    return Boolean(card.front.trim() && card.back.trim());
  }

  if (lesson.type === 'quiz') {
    const quiz = parseQuizContent(lesson.quiz ?? createEmptyQuizDraft());
    return isLessonDraftReady({
      type: 'quiz',
      title: lesson.title,
      content: lesson.content ?? '',
      videoUrl: lesson.videoUrl ?? '',
      aiPrompt: lesson.aiPrompt ?? '',
      microCard: {
        front: '',
        pinyin: '',
        back: '',
        example: '',
        audioUrl: '',
      },
      quiz,
    });
  }

  return true;
}
