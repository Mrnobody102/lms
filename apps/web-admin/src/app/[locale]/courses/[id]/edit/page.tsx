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
  useToggleCourseStatus,
  useReorderUnits,
  useReorderLessons,
} from '@/hooks/use-courses';
import { usePrograms } from '@/hooks/use-programs';
import { LessonList } from '@/features/courses/lesson-list';
import { AddLessonDialog } from '@/features/courses/add-lesson-form';
import { EditLessonDialog } from '@/features/courses/edit-lesson-form';
import { CourseStats } from '@/features/courses/course-stats';
import { CourseReportPanel } from '@/features/courses/course-report-panel';
import { EnrollmentPanel } from '@/features/courses/enrollment-panel';
import {
  createEmptyMicroCardDraft,
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
import { Button, Alert, AlertDescription, Badge, Label } from '@/components/ui';
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Save,
  Settings,
  Users,
  BookOpen,
  Globe,
  EyeOff,
} from 'lucide-react';
import { Link } from '@/navigation';

const EMPTY_ARRAY: never[] = [];

export default function CourseEditorPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const courseId = params.id as string;

  const { data: course, isLoading } = useCourse(courseId);
  const { data: report, isLoading: reportLoading } = useCourseReport(courseId);
  const { data: programs } = usePrograms();
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
  const reorderUnits = useReorderUnits();
  const reorderLessons = useReorderLessons();

  const [activeTab, setActiveTab] = useState<'curriculum' | 'settings' | 'students'>('curriculum');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localTitle, setLocalTitle] = useState('');
  const [localLevelId, setLocalLevelId] = useState<string>('');
  const [localAiEnabled, setLocalAiEnabled] = useState(false);
  const [localAiPrompt, setLocalAiPrompt] = useState('');
  const [localCoverImageUrl, setLocalCoverImageUrl] = useState('');

  const toggleCourseStatus = useToggleCourseStatus();
  const courseIsActive = course?.isActive !== false;

  useEffect(() => {
    if (!course) return;

    setLocalTitle(course.title);
    setLocalLevelId(course.levelId || '');
    setLocalCoverImageUrl(course.coverImageUrl || '');
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
          coverImageUrl: localCoverImageUrl.trim() || undefined,
          aiSettings: buildCourseAiSettings(localAiEnabled, localAiPrompt),
        },
      },
      {
        onSuccess: () => showMsg('success', 'courseSaved'),
        onError: () => showMsg('error', 'courseSaveError'),
      },
    );
  };

  const handleToggleStatus = () => {
    toggleCourseStatus.mutate(
      { id: courseId, isActive: !courseIsActive },
      {
        onSuccess: () =>
          showMsg('success', courseIsActive ? 'courseUnpublished' : 'coursePublished'),
        onError: () => showMsg('error', 'courseStatusError'),
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

    const newOrder = [...siblings];
    const [movedItem] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, movedItem);

    try {
      await reorderLessons.mutateAsync({
        courseId,
        unitId: lesson.unitId || '',
        lessonIds: newOrder.map((item) => item.id),
      });
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
      await reorderUnits.mutateAsync({
        courseId,
        unitIds: newOrder.map((item) => item.id),
      });
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
          <AlertDescription>{t('courseNotFound')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 relative">
          {/* Sticky Header with Title Edit and Tabs */}
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b pt-4 px-6 lg:px-8">
            <div className="max-w-6xl mx-auto flex flex-col gap-4">
              {/* Top Row: Back, Title, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href="/courses"
                    className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title={t('backToList')}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Link>
                  <div className="w-px h-6 bg-border mx-1 shrink-0" />
                  <div className="flex flex-wrap items-center gap-3 min-w-0 flex-1">
                    <input
                      value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      onBlur={handleUpdateCourse}
                      className="text-2xl font-bold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 -ml-2 transition-all w-full sm:w-auto sm:min-w-[300px] sm:max-w-md truncate"
                      placeholder={t('courseName')}
                    />
                    <Badge
                      variant={lessonReadiness.isReady ? 'success' : 'outline'}
                      className="cursor-default pointer-events-none mt-1 sm:mt-0"
                    >
                      {lessonReadiness.isReady ? t('readyToSave') : t('needsAttention')}
                    </Badge>
                    <Badge
                      variant={courseIsActive ? 'success' : 'secondary'}
                      className="cursor-default pointer-events-none mt-1 sm:mt-0"
                    >
                      {courseIsActive ? t('published') : t('draft')}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {firstLessonPreviewUrl && (
                    <a href={firstLessonPreviewUrl} target="_blank" rel="noreferrer">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 rounded-full bg-background/50 hover:bg-background shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('previewFirstLesson')}
                      </Button>
                    </a>
                  )}
                  <Button
                    variant={courseIsActive ? 'outline' : 'default'}
                    onClick={handleToggleStatus}
                    disabled={toggleCourseStatus.isPending}
                    size="sm"
                    className="gap-1.5 rounded-full shadow-sm"
                  >
                    {toggleCourseStatus.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : courseIsActive ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    {courseIsActive ? t('unpublishCourse') : t('publishCourse')}
                  </Button>
                  <Button
                    onClick={handleUpdateCourse}
                    disabled={updateCourse.isPending}
                    size="sm"
                    className="gap-1.5 rounded-full shadow-sm"
                  >
                    {updateCourse.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t('save')}
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab('curriculum')}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'curriculum'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {t('curriculumTab')}
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'settings'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {t('settingsTab')}
                </button>
                <button
                  onClick={() => setActiveTab('students')}
                  className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                    activeTab === 'students'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {t('studentsStatsTab')}
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8 max-w-6xl mx-auto pb-24">
            {/* Toast */}
            {message && (
              <div
                className={`mb-6 flex items-center gap-2 p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2 ${
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

            {/* Curriculum Tab */}
            <div
              className={`transition-all duration-300 animate-in fade-in ${activeTab === 'curriculum' ? 'block' : 'hidden'}`}
            >
              <div className="bg-card border rounded-2xl shadow-sm p-2 sm:p-6">
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

            {/* Settings Tab */}
            <div
              className={`transition-all duration-300 animate-in fade-in ${activeTab === 'settings' ? 'block' : 'hidden'}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Advanced Settings */}
                <div className="space-y-6">
                  <div className="bg-card border rounded-2xl shadow-sm p-6 space-y-6">
                    <h2 className="text-lg font-semibold">{t('basicInfo')}</h2>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('coverImageUrl')}</Label>
                      <input
                        type="url"
                        value={localCoverImageUrl}
                        onChange={(e) => setLocalCoverImageUrl(e.target.value)}
                        onBlur={handleUpdateCourse}
                        placeholder={t('coverImageUrlPlaceholder')}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      />
                      {localCoverImageUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden border aspect-video bg-muted relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={localCoverImageUrl}
                            alt="Course cover preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{t('coverImageUrlDesc')}</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">{t('levelOptional')}</Label>
                      <select
                        value={localLevelId || ''}
                        onChange={(e) => setLocalLevelId(e.target.value)}
                        onBlur={handleUpdateCourse}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                      >
                        <option value="">{t('none')}</option>
                        {programs?.map((p) => {
                          if (!p.levels || p.levels.length === 0) return null;
                          return (
                            <optgroup key={p.id} label={p.title}>
                              {p.levels.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.title}
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </select>
                      <p className="text-xs text-muted-foreground">{t('levelOptionalDesc')}</p>
                    </div>

                    <div className="rounded-xl border bg-muted/20 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <Label className="text-sm font-medium">{t('aiSettings')}</Label>
                          <p className="text-xs text-muted-foreground">{t('aiSettingsDesc')}</p>
                        </div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localAiEnabled}
                            onChange={(event) => {
                              setLocalAiEnabled(event.target.checked);
                              // We don't auto-save immediately on checkbox to prevent jitter, rely on Save button
                            }}
                            className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                          />
                          {t('aiEnabled')}
                        </label>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm">{t('aiPrompt')}</Label>
                        <textarea
                          value={localAiPrompt}
                          onChange={(event) => setLocalAiPrompt(event.target.value)}
                          onBlur={handleUpdateCourse}
                          placeholder={t('aiPromptPlaceholder')}
                          className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10 resize-y"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Draft Preview Checklist */}
                <div>
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
                </div>
              </div>
            </div>

            {/* Students & Stats Tab */}
            <div
              className={`transition-all duration-300 animate-in fade-in ${activeTab === 'students' ? 'block' : 'hidden'}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-card border rounded-2xl shadow-sm p-6">
                    <CourseStats lessons={lessons} />
                  </div>
                  <div className="bg-card border rounded-2xl shadow-sm p-6">
                    <CourseReportPanel report={report} loading={reportLoading} />
                  </div>
                </div>
                <div>
                  <div className="bg-card border rounded-2xl shadow-sm p-6 h-full">
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
    return parseMicroCardContent(lesson.content).some(
      (card) => card.front.trim() && card.back.trim(),
    );
  }

  if (lesson.type === 'quiz') {
    const quiz = parseQuizContent(lesson.quiz ?? createEmptyQuizDraft());
    return isLessonDraftReady({
      type: 'quiz',
      title: lesson.title,
      content: lesson.content ?? '',
      videoUrl: lesson.videoUrl ?? '',
      aiPrompt: lesson.aiPrompt ?? '',
      microCards: [createEmptyMicroCardDraft()],
      quiz,
    });
  }

  return true;
}
