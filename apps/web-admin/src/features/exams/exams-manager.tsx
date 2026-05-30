'use client';

import { FormEvent, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useTranslations } from 'next-intl';
import { PaginationControls } from '@repo/ui';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Copy,
  FileCheck2,
  Eye,
  Loader2,
  PencilLine,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { DraftPreviewCard } from '@/components/authoring/draft-preview-card';
import { QuestionOptionsEditor } from '@/components/authoring/question-options-editor';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { AudioUploadField } from '@/components/media/audio-upload-field';
import { formatDraftValue, parseCsv, parseList } from '@/features/authoring/draft-utils';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useCreateExam,
  useDeleteExam,
  useExam,
  useExamsPage,
  useUpdateExam,
} from '@/hooks/use-exams';
import { useDebounce } from '@/hooks/use-debounce';
import { Exam, ExamQuestionType, ExamSummary } from '@/lib/exam-api';

type ExamQuestionDraft = {
  id: string;
  type: ExamQuestionType;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  points: string;
  skillTags: string;
  explanation: string;
  audioMediaAssetId: string | null;
  audioUrl: string | null;
  audioReplayLimit: number | null;
};

function createExamQuestionDraft(type: ExamQuestionType = 'MULTIPLE_CHOICE'): ExamQuestionDraft {
  return {
    id:
      typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    prompt: '',
    optionsText: '',
    correctAnswer: '',
    points: '1',
    skillTags: '',
    explanation: '',
    audioMediaAssetId: null,
    audioUrl: null,
    audioReplayLimit: null,
  };
}

const EXAMS_PAGE_SIZE = 10;

interface ExamsManagerProps {
  /** When provided, the manager is locked to this course and the selector is hidden. */
  courseId?: string;
  /** Show the course selector dropdown (standalone page mode). Defaults to true. */
  showCourseSelector?: boolean;
}

export function ExamsManager({
  courseId: lockedCourseId,
  showCourseSelector = true,
}: ExamsManagerProps) {
  const t = useTranslations('Admin');
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [courseId, setCourseId] = useState(lockedCourseId ?? '');
  const [unitId, setUnitId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('30');
  const [passingScore, setPassingScore] = useState('60');
  const [isPublished, setIsPublished] = useState(true);
  const [sectionTitle, setSectionTitle] = useState('');
  const [questionDrafts, setQuestionDrafts] = useState<ExamQuestionDraft[]>(() => [
    createExamQuestionDraft(),
  ]);
  const [templateExamId, setTemplateExamId] = useState('');
  const [templateAction, setTemplateAction] = useState<'load' | 'duplicate' | 'edit' | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<ExamSummary | null>(null);
  const [selectedExamIds, setSelectedExamIds] = useState<string[]>([]);
  const [examSearch, setExamSearch] = useState('');
  const [examStatusFilter, setExamStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [examPage, setExamPage] = useState(1);
  const [examBulkDeleteOpen, setExamBulkDeleteOpen] = useState(false);
  const [examBulkAction, setExamBulkAction] = useState<'publish' | 'unpublish' | 'delete' | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<'list' | 'editor'>('list');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const debouncedExamSearch = useDebounce(examSearch, 300);
  const { data: examsPageData, isLoading: examsLoading } = useExamsPage({
    ...query,
    page: examPage,
    limit: EXAMS_PAGE_SIZE,
    search: debouncedExamSearch.trim() || undefined,
    status: examStatusFilter,
  });
  const { data: templateExam, isLoading: templateLoading } = useExam(templateExamId);
  const createExam = useCreateExam();
  const updateExam = useUpdateExam();
  const deleteExam = useDeleteExam();
  const selectedUnit = units.find((unit) => unit.id === unitId) ?? null;
  const examSaving = createExam.isPending || updateExam.isPending;
  const exams = examsPageData?.data ?? [];
  const filteredExams = exams;
  const examsTotal = examsPageData?.meta.total ?? exams.length;
  const examsTotalPages = Math.max(examsPageData?.meta.totalPages ?? 1, 1);
  const hasExamFilters = debouncedExamSearch.trim().length > 0 || examStatusFilter !== 'all';
  const examBulkPending = examBulkAction !== null;
  const draft = useMemo(
    () =>
      buildExamDraft({
        courseId,
        title,
        sectionTitle,
        durationMinutes,
        passingScore,
        questionDrafts,
      }),
    [courseId, durationMinutes, passingScore, questionDrafts, sectionTitle, title],
  );

  useEffect(() => {
    if (showCourseSelector && !courseId && courses[0]?.id) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses, showCourseSelector]);

  // Embedded mode: keep the manager locked to the host course.
  useEffect(() => {
    if (lockedCourseId && courseId !== lockedCourseId) {
      setCourseId(lockedCourseId);
    }
  }, [lockedCourseId, courseId]);

  useEffect(() => {
    setUnitId('');
    setEditingExamId(null);
    setSelectedExamIds([]);
    setExamPage(1);
  }, [courseId]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!templateExam || !templateAction) return;

    hydrateDraftFromExam(templateExam, templateAction === 'duplicate', {
      setCourseId,
      setUnitId,
      setTitle,
      setDescription,
      setDurationMinutes,
      setPassingScore,
      setIsPublished,
      setSectionTitle,
      setQuestionDrafts,
      duplicateTitle: (value) => t('duplicatedExamTitle', { title: value }),
    });
    setEditingExamId(templateAction === 'edit' ? templateExam.id : null);
    setActiveTab('editor');
    setMessage({
      type: 'success',
      text:
        templateAction === 'duplicate'
          ? t('examDuplicatedToDraft')
          : templateAction === 'edit'
            ? t('examLoadedForEdit')
            : t('examLoadedToDraft'),
    });
    setTemplateAction(null);
    setTemplateExamId('');
  }, [t, templateAction, templateExam]);

  const resetExamDraft = () => {
    setEditingExamId(null);
    setTitle('');
    setDescription('');
    setDurationMinutes('30');
    setPassingScore('60');
    setIsPublished(true);
    setSectionTitle('');
    setQuestionDrafts([createExamQuestionDraft()]);
  };

  const handleSubmitExam = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.checks.course || !draft.checks.title || !draft.checks.section) {
      setMessage({ type: 'error', text: t('examRequiredFields') });
      return;
    }

    if (!draft.checks.hasQuestions) {
      setMessage({ type: 'error', text: t('examQuestionsRequired') });
      return;
    }

    if (!draft.checks.duration || !draft.checks.passingScore) {
      setMessage({ type: 'error', text: t('examNumericFieldsRequired') });
      return;
    }

    if (draft.invalidQuestionCount > 0) {
      setMessage({ type: 'error', text: t('examQuestionValidationError') });
      return;
    }

    const payload = {
      unitId: unitId || null,
      title: title.trim(),
      description: description.trim() || null,
      durationMinutes: draft.durationMinutes ?? 0,
      passingScore: draft.passingScore ?? 0,
      isPublished,
      sections: [
        {
          title: sectionTitle.trim(),
          questions: draft.questions,
        },
      ],
    };

    const mutation = editingExamId
      ? updateExam.mutateAsync({ id: editingExamId, payload })
      : createExam.mutateAsync({
          courseId,
          unitId: unitId || undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          durationMinutes: draft.durationMinutes ?? 0,
          passingScore: draft.passingScore ?? 0,
          isPublished,
          sections: [
            {
              title: sectionTitle.trim(),
              questions: draft.questions,
            },
          ],
        });

    mutation
      .then(() => {
        resetExamDraft();
        setActiveTab('list');
        setMessage({
          type: 'success',
          text: editingExamId ? t('examUpdated') : t('examCreated'),
        });
      })
      .catch(() =>
        setMessage({
          type: 'error',
          text: editingExamId ? t('examUpdateError') : t('examCreateError'),
        }),
      );
  };

  const updateQuestionDraft = (id: string, patch: Partial<ExamQuestionDraft>) => {
    setQuestionDrafts((current) =>
      current.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    );
  };

  const addQuestionDraft = () => {
    const lastType = questionDrafts.at(-1)?.type ?? 'MULTIPLE_CHOICE';
    setQuestionDrafts((current) => [...current, createExamQuestionDraft(lastType)]);
  };

  const duplicateQuestionDraft = (id: string) => {
    setQuestionDrafts((current) => {
      const index = current.findIndex((question) => question.id === id);
      if (index === -1) return current;

      const next = [...current];
      next.splice(index + 1, 0, {
        ...current[index],
        id: createExamQuestionDraft().id,
      });
      return next;
    });
  };

  const removeQuestionDraft = (id: string) => {
    setQuestionDrafts((current) =>
      current.length <= 1 ? current : current.filter((question) => question.id !== id),
    );
  };

  const moveQuestionDraft = (id: string, direction: -1 | 1) => {
    setQuestionDrafts((current) => {
      const index = current.findIndex((question) => question.id === id);
      const nextIndex = index + direction;
      if (index === -1 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [question] = next.splice(index, 1);
      next.splice(nextIndex, 0, question);
      return next;
    });
  };

  const loadExamTemplate = (examId: string, action: 'load' | 'duplicate' | 'edit') => {
    setTemplateExamId(examId);
    setTemplateAction(action);
  };

  const handleEditExam = (examId: string) => {
    loadExamTemplate(examId, 'edit');
  };

  const handleDeleteExam = (exam: ExamSummary) => {
    setExamToDelete(exam);
  };

  const toggleExamSelection = (examId: string, checked: boolean) => {
    setSelectedExamIds((current) =>
      checked
        ? current.includes(examId)
          ? current
          : [...current, examId]
        : current.filter((id) => id !== examId),
    );
  };

  const selectAllExams = () => {
    setSelectedExamIds(filteredExams.map((exam) => exam.id));
  };

  const clearSelectedExams = () => {
    setSelectedExamIds([]);
  };

  const clearExamFilters = () => {
    setExamSearch('');
    setExamStatusFilter('all');
    setExamPage(1);
  };

  const handleToggleExamPublished = (exam: ExamSummary) => {
    const nextPublished = !exam.isPublished;
    updateExam.mutate(
      { id: exam.id, payload: { isPublished: nextPublished } },
      {
        onSuccess: () =>
          setMessage({
            type: 'success',
            text: nextPublished ? t('examPublished') : t('examUnpublished'),
          }),
        onError: () => setMessage({ type: 'error', text: t('examPublishUpdateError') }),
      },
    );
  };

  const handleBulkExamPublish = async (nextPublished: boolean) => {
    if (selectedExamIds.length === 0) return;
    const ids = [...selectedExamIds];
    setExamBulkAction(nextPublished ? 'publish' : 'unpublish');
    try {
      await Promise.all(
        ids.map((id) => updateExam.mutateAsync({ id, payload: { isPublished: nextPublished } })),
      );
      setSelectedExamIds([]);
      setMessage({
        type: 'success',
        text: nextPublished
          ? t('bulkExamsPublished', { count: ids.length })
          : t('bulkExamsUnpublished', { count: ids.length }),
      });
    } catch {
      setMessage({ type: 'error', text: t('bulkExamUpdateError') });
    } finally {
      setExamBulkAction(null);
    }
  };

  const handleBulkDeleteExams = async () => {
    if (selectedExamIds.length === 0) return;
    const ids = [...selectedExamIds];
    setExamBulkAction('delete');
    try {
      await Promise.all(ids.map((id) => deleteExam.mutateAsync(id)));
      if (editingExamId && ids.includes(editingExamId)) resetExamDraft();
      setSelectedExamIds([]);
      setExamBulkDeleteOpen(false);
      setMessage({
        type: 'success',
        text: t('bulkExamsDeleted', { count: ids.length }),
      });
    } catch {
      setMessage({ type: 'error', text: t('bulkExamDeleteError') });
    } finally {
      setExamBulkAction(null);
    }
  };

  return (
    <>
      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-destructive/5 border-destructive/20 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {showCourseSelector && (
          <div className="space-y-1.5">
            <Label>{t('courseName')}</Label>
            <select
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={coursesLoading}
            >
              <option value="">{t('selectCourse')}</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>{t('unit')}</Label>
          <select
            value={unitId}
            onChange={(event) => {
              setUnitId(event.target.value);
              setSelectedExamIds([]);
              setExamPage(1);
            }}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={!courseId}
          >
            <option value="">{t('allUnits')}</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!courseId ? (
        <Alert>
          <FileCheck2 className="h-4 w-4" />
          <AlertDescription>{t('examSelectCourseFirst')}</AlertDescription>
        </Alert>
      ) : (
        <div>
          <div className="mb-6 border-b border-border">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('list')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'list'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('examTemplates')}
              </button>
              <button
                onClick={() => setActiveTab('editor')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'editor'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {editingExamId ? t('editExam') : t('createExam')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'list' && (
              <section className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{t('examTemplates')}</h2>
                    <p className="text-sm text-muted-foreground">{t('examTemplatesDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{examsTotal}</Badge>
                    {exams.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllExams}
                          disabled={filteredExams.length === 0}
                        >
                          {t('selectAllItems')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSelectedExams}
                          disabled={selectedExamIds.length === 0}
                        >
                          {t('clearSelection')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <Input
                    value={examSearch}
                    onChange={(event) => {
                      setExamSearch(event.target.value);
                      setExamPage(1);
                    }}
                    placeholder={t('searchExams')}
                  />
                  <select
                    value={examStatusFilter}
                    onChange={(event) => {
                      setExamStatusFilter(event.target.value as 'all' | 'published' | 'draft');
                      setExamPage(1);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">{t('allStatuses')}</option>
                    <option value="published">{t('publishedOnly')}</option>
                    <option value="draft">{t('draftOnly')}</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearExamFilters}
                    disabled={!examSearch && examStatusFilter === 'all'}
                  >
                    {t('clearFilters')}
                  </Button>
                </div>

                {examsLoading ? (
                  <LoadingRow label={t('loading')} />
                ) : exams.length === 0 ? (
                  <EmptyState title={hasExamFilters ? t('noFilteredExams') : t('noExams')} />
                ) : (
                  <div className="grid gap-3">
                    {selectedExamIds.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                        <span className="text-sm font-medium">
                          {t('selectedItemsValue', { count: selectedExamIds.length })}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={examBulkPending}
                            onClick={() => handleBulkExamPublish(true)}
                          >
                            {examBulkAction === 'publish' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {t('publishSelected')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={examBulkPending}
                            onClick={() => handleBulkExamPublish(false)}
                          >
                            {examBulkAction === 'unpublish' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            {t('unpublishSelected')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={examBulkPending}
                            onClick={() => setExamBulkDeleteOpen(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('deleteSelected')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {filteredExams.map((exam) => (
                      <article key={exam.id} className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1"
                            aria-label={t('selectItem')}
                            checked={selectedExamIds.includes(exam.id)}
                            onChange={(event) => toggleExamSelection(exam.id, event.target.checked)}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">{exam.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {exam.unit?.title || t('allUnits')}
                                </p>
                              </div>
                              <Badge variant={exam.isPublished ? 'success' : 'outline'}>
                                {exam.isPublished ? t('published') : t('draft')}
                              </Badge>
                            </div>
                            {exam.description && (
                              <p className="mt-2 text-sm text-muted-foreground">
                                {exam.description}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                              <span>{t('durationValue', { minutes: exam.durationMinutes })}</span>
                              <span>
                                {t('passingScoreValue', { value: exam.passingScore ?? 0 })}
                              </span>
                              <span>
                                {t('sectionCount', { count: exam._count?.sections ?? 0 })}
                              </span>
                              <span>
                                {t('attemptCount', { count: exam._count?.attempts ?? 0 })}
                              </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={updateExam.isPending}
                                onClick={() => handleToggleExamPublished(exam)}
                              >
                                {exam.isPublished ? (
                                  <X className="h-3.5 w-3.5" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                )}
                                {exam.isPublished ? t('unpublish') : t('publish')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={templateLoading && templateExamId === exam.id}
                                onClick={() => handleEditExam(exam.id)}
                              >
                                {templateLoading &&
                                templateExamId === exam.id &&
                                templateAction === 'edit' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <PencilLine className="h-3.5 w-3.5" />
                                )}
                                {t('editExam')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="gap-2"
                                disabled={templateLoading && templateExamId === exam.id}
                                onClick={() => loadExamTemplate(exam.id, 'load')}
                              >
                                {templateLoading &&
                                templateExamId === exam.id &&
                                templateAction === 'load' ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Eye className="h-3.5 w-3.5" />
                                )}
                                {t('loadExamToDraft')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="gap-2"
                                disabled={templateLoading && templateExamId === exam.id}
                                onClick={() => loadExamTemplate(exam.id, 'duplicate')}
                              >
                                <Copy className="h-3.5 w-3.5" />
                                {t('duplicateExam')}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteExam(exam)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t('deleteExam')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                    <PaginationControls
                      page={examPage}
                      totalPages={examsTotalPages}
                      disabled={examsLoading}
                      labels={{
                        previous: t('previousPage'),
                        next: t('nextPage'),
                        pageValue: t('pageValue', {
                          page: examPage,
                          total: examsTotalPages,
                        }),
                      }}
                      onPageChange={setExamPage}
                    />
                  </div>
                )}
              </section>
            )}

            {activeTab === 'editor' && (
              <aside className="space-y-6">
                <DraftPreviewCard
                  title={t('examPreview')}
                  ready={draft.isReady}
                  rows={[
                    {
                      label: t('courseName'),
                      value: selectedCourse?.title ?? t('selectCourse'),
                    },
                    { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                    { label: t('status'), value: isPublished ? t('published') : t('draft') },
                    {
                      label: t('examTitle'),
                      value: title.trim() || t('examTitlePlaceholder'),
                    },
                    {
                      label: t('sectionTitle'),
                      value: sectionTitle.trim() || t('sectionTitlePlaceholder'),
                    },
                    {
                      label: t('examQuestions'),
                      value: draft.questionCount,
                    },
                    {
                      label: t('sections'),
                      value: draft.sectionCount,
                    },
                    {
                      label: t('durationMinutes'),
                      value: draft.durationMinutes ?? 0,
                    },
                    {
                      label: t('passingScore'),
                      value: draft.passingScore ?? 0,
                    },
                    {
                      label: t('readyQuestions'),
                      value: `${draft.validQuestionCount}/${draft.questionCount}`,
                    },
                  ]}
                  checklist={[
                    { label: t('courseName'), ok: draft.checks.course },
                    { label: t('examTitle'), ok: draft.checks.title },
                    { label: t('sectionTitle'), ok: draft.checks.section },
                    { label: t('examQuestions'), ok: draft.checks.questions },
                    { label: t('durationMinutes'), ok: draft.checks.duration },
                    { label: t('passingScore'), ok: draft.checks.passingScore },
                  ]}
                />

                <form onSubmit={handleSubmitExam} className="rounded-xl border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">
                      {editingExamId ? t('editExam') : t('createExam')}
                    </h2>
                    {editingExamId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={resetExamDraft}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t('cancelEdit')}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>{t('examTitle')}</Label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder={t('examTitlePlaceholder')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('description')}</Label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>{t('durationMinutes')}</Label>
                        <Input
                          value={durationMinutes}
                          onChange={(event) => setDurationMinutes(event.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t('passingScore')}</Label>
                        <Input
                          value={passingScore}
                          onChange={(event) => setPassingScore(event.target.value)}
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(event) => setIsPublished(event.target.checked)}
                      />
                      {t('publishNow')}
                    </label>

                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-1.5">
                        <Label>{t('sectionTitle')}</Label>
                        <Input
                          value={sectionTitle}
                          onChange={(event) => setSectionTitle(event.target.value)}
                          placeholder={t('sectionTitlePlaceholder')}
                        />
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Label>{t('examQuestions')}</Label>
                          <p className="text-xs text-muted-foreground">{t('examQuestionsDesc')}</p>
                        </div>
                        <button
                          type="button"
                          onClick={addQuestionDraft}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold hover:bg-muted"
                        >
                          <Plus className="h-4 w-4" />
                          {t('addQuestion')}
                        </button>
                      </div>

                      <div className="space-y-4">
                        {questionDrafts.map((draftItem, index) => (
                          <QuestionDraftCard
                            key={draftItem.id}
                            draft={draftItem}
                            index={index}
                            canMoveUp={index > 0}
                            canMoveDown={index < questionDrafts.length - 1}
                            canRemove={questionDrafts.length > 1}
                            disabled={examSaving}
                            onChange={(patch) => updateQuestionDraft(draftItem.id, patch)}
                            onDuplicate={() => duplicateQuestionDraft(draftItem.id)}
                            onRemove={() => removeQuestionDraft(draftItem.id)}
                            onMoveUp={() => moveQuestionDraft(draftItem.id, -1)}
                            onMoveDown={() => moveQuestionDraft(draftItem.id, 1)}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={examSaving}>
                      {examSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingExamId ? (
                        <PencilLine className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingExamId ? t('updateExam') : t('createExam')}
                    </Button>
                  </div>
                </form>
              </aside>
            )}
          </div>
        </div>
      )}
      <DeleteConfirmDialog
        open={Boolean(examToDelete)}
        title={t('deleteExam')}
        description={t('confirmDeleteExam')}
        confirmLabel={t('deleteExam')}
        cancelLabel={t('cancel')}
        pending={deleteExam.isPending}
        onOpenChange={(open) => {
          if (!open) setExamToDelete(null);
        }}
        onConfirm={() => {
          if (!examToDelete) return;
          deleteExam.mutate(examToDelete.id, {
            onSuccess: () => {
              if (editingExamId === examToDelete.id) resetExamDraft();
              setExamToDelete(null);
              setMessage({ type: 'success', text: t('examDeleted') });
            },
            onError: () => setMessage({ type: 'error', text: t('examDeleteError') }),
          });
        }}
      />
      <DeleteConfirmDialog
        open={examBulkDeleteOpen}
        title={t('deleteSelected')}
        description={t('confirmBulkDeleteExams', { count: selectedExamIds.length })}
        confirmLabel={t('deleteSelected')}
        cancelLabel={t('cancel')}
        pending={examBulkAction === 'delete'}
        onOpenChange={setExamBulkDeleteOpen}
        onConfirm={handleBulkDeleteExams}
      />
    </>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{title}</div>
  );
}

function DeleteConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  pending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={pending}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function QuestionDraftCard({
  draft,
  index,
  canMoveUp,
  canMoveDown,
  canRemove,
  disabled,
  onChange,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
  t,
}: {
  draft: ExamQuestionDraft;
  index: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canRemove: boolean;
  disabled: boolean;
  onChange: (patch: Partial<ExamQuestionDraft>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  t: ReturnType<typeof useTranslations<'Admin'>>;
}) {
  const options = parseList(draft.optionsText);
  const points = parsePositiveNumber(draft.points);
  const hasCorrectAnswer = draft.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(draft.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);
  const correctAnswerInRange =
    draft.type === 'MULTIPLE_CHOICE'
      ? correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length
      : hasCorrectAnswer;
  const isReady =
    draft.prompt.trim().length > 0 &&
    (draft.type !== 'MULTIPLE_CHOICE' || options.length >= 2) &&
    correctAnswerInRange &&
    points !== null;

  return (
    <article className="rounded-xl border bg-muted/20 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{t('questionLabel', { index: index + 1 })}</h3>
            <Badge variant={isReady ? 'success' : 'outline'}>
              {isReady ? t('readyToSave') : t('needsAttention')}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {draft.type === 'MULTIPLE_CHOICE' ? t('multipleChoice') : t('fillBlank')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title={t('moveUp')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-40"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title={t('moveDown')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border disabled:opacity-40"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            title={t('duplicateQuestion')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            title={t('remove')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border text-destructive disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('questionPrompt')}</Label>
          <textarea
            value={draft.prompt}
            onChange={(event) => onChange({ prompt: event.target.value })}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder={t('questionPromptPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('questionType')}</Label>
          <select
            value={draft.type}
            onChange={(event) => onChange({ type: event.target.value as ExamQuestionType })}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
            <option value="FILL_BLANK">{t('fillBlank')}</option>
            <option value="MATCHING">{t('matching')}</option>
            <option value="ORDERING">{t('ordering')}</option>
            <option value="AI_EVALUATED_AUDIO">{t('aiEvaluatedAudio')}</option>
            <option value="AI_EVALUATED_TEXT">{t('aiEvaluatedText')}</option>
          </select>
          {(draft.type === 'AI_EVALUATED_AUDIO' || draft.type === 'AI_EVALUATED_TEXT') && (
            <p className="text-xs text-muted-foreground">{t('aiQuestionHint')}</p>
          )}
        </div>

        {isAudioPromptQuestionType(draft.type) ? (
          <AudioUploadField
            assetId={draft.audioMediaAssetId}
            audioUrl={draft.audioUrl}
            replayLimit={draft.audioReplayLimit}
            disabled={disabled}
            onChange={({ assetId, audioUrl, replayLimit }) =>
              onChange({
                audioMediaAssetId: assetId,
                audioUrl,
                audioReplayLimit: replayLimit,
              })
            }
          />
        ) : null}

        <QuestionOptionsEditor
          type={draft.type}
          optionsText={draft.optionsText}
          correctAnswer={draft.correctAnswer}
          onChange={(updates) => {
            const next = { ...updates } as Partial<ExamQuestionDraft>;
            onChange(next);
          }}
          t={t}
        />

        <div className="grid grid-cols-[1fr_90px] gap-3">
          {draft.type !== 'MULTIPLE_CHOICE' &&
          draft.type !== 'MATCHING' &&
          draft.type !== 'ORDERING' ? (
            <div className="space-y-1.5">
              <Label>{t('correctAnswer')}</Label>
              <Input
                value={draft.correctAnswer}
                onChange={(event) => onChange({ correctAnswer: event.target.value })}
                placeholder={t('correctAnswerTextPlaceholder')}
              />
            </div>
          ) : (
            <div />
          )}
          <div className="space-y-1.5">
            <Label>{t('points')}</Label>
            <Input
              value={draft.points}
              onChange={(event) => onChange({ points: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{t('skillTags')}</Label>
          <Input
            value={draft.skillTags}
            onChange={(event) => onChange({ skillTags: event.target.value })}
            placeholder={t('skillTagsPlaceholder')}
          />
        </div>

        <div className="space-y-1.5">
          <Label>{t('explanation')}</Label>
          <textarea
            value={draft.explanation}
            onChange={(event) => onChange({ explanation: event.target.value })}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
      </div>
    </article>
  );
}

function buildExamDraft(params: {
  courseId: string;
  title: string;
  sectionTitle: string;
  durationMinutes: string;
  passingScore: string;
  questionDrafts: ExamQuestionDraft[];
}) {
  const durationMinutes = parsePositiveInteger(params.durationMinutes);
  const passingScore = parsePercentage(params.passingScore);
  const questions = params.questionDrafts.map((draft) => buildExamQuestionPayload(draft));
  const checks = {
    course: Boolean(params.courseId),
    title: params.title.trim().length > 0,
    section: params.sectionTitle.trim().length > 0,
    duration: durationMinutes !== null,
    passingScore: passingScore !== null,
    hasQuestions: questions.length > 0,
    questions: questions.length > 0 && questions.every((question) => question.valid),
  };

  return {
    durationMinutes,
    passingScore,
    sectionCount: 1,
    questionCount: questions.length,
    validQuestionCount: questions.filter((question) => question.valid).length,
    invalidQuestionCount: questions.filter((question) => !question.valid).length,
    questions: questions.map((question) => question.payload),
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function parseMatchingOptions(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseMatchingAnswer(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseOrderingAnswer(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function buildExamQuestionPayload(draft: ExamQuestionDraft) {
  const options = parseList(draft.optionsText);
  const points = parsePositiveNumber(draft.points);
  const skillTags = parseCsv(draft.skillTags);
  const hasCorrectAnswer = draft.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(draft.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);

  let parsedOptions: unknown = options;
  let finalCorrectAnswer: unknown = draft.correctAnswer.trim();
  let correctAnswerValid = false;
  let optionsValid = true;

  if (draft.type === 'MULTIPLE_CHOICE') {
    correctAnswerValid =
      correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length;
    finalCorrectAnswer = correctAnswerIndex;
    optionsValid = options.length >= 2;
  } else if (draft.type === 'MATCHING') {
    const matchingOptions = parseMatchingOptions(draft.optionsText) as {
      left: string[];
      right: string[];
    } | null;
    parsedOptions = matchingOptions;
    optionsValid =
      Boolean(matchingOptions) &&
      Array.isArray(matchingOptions?.left) &&
      Array.isArray(matchingOptions?.right);
    finalCorrectAnswer = parseMatchingAnswer(draft.correctAnswer);
    correctAnswerValid = Boolean(finalCorrectAnswer) && typeof finalCorrectAnswer === 'object';
  } else if (draft.type === 'ORDERING') {
    parsedOptions = options;
    optionsValid = options.length >= 2;
    const orderingAnswer = parseOrderingAnswer(draft.correctAnswer);
    finalCorrectAnswer = orderingAnswer;
    correctAnswerValid = Array.isArray(orderingAnswer);
  } else {
    correctAnswerValid = hasCorrectAnswer;
    parsedOptions = undefined;
  }

  const valid =
    draft.prompt.trim().length > 0 && optionsValid && correctAnswerValid && points !== null;

  return {
    valid,
    payload: {
      type: draft.type,
      prompt: draft.prompt.trim(),
      options: parsedOptions,
      correctAnswer: finalCorrectAnswer,
      explanation: draft.explanation.trim() || undefined,
      points: points ?? 1,
      skillTags,
      audioMediaAssetId: isAudioPromptQuestionType(draft.type)
        ? draft.audioMediaAssetId
        : undefined,
      audioReplayLimit: isAudioPromptQuestionType(draft.type) ? draft.audioReplayLimit : undefined,
    },
  };
}

function isAudioPromptQuestionType(type: ExamQuestionType) {
  return type !== 'AI_EVALUATED_AUDIO' && type !== 'AI_EVALUATED_TEXT';
}

function hydrateDraftFromExam(
  exam: Exam,
  duplicate: boolean,
  actions: {
    setCourseId: (value: string) => void;
    setUnitId: (value: string) => void;
    setTitle: (value: string) => void;
    setDescription: (value: string) => void;
    setDurationMinutes: (value: string) => void;
    setPassingScore: (value: string) => void;
    setIsPublished: (value: boolean) => void;
    setSectionTitle: (value: string) => void;
    setQuestionDrafts: Dispatch<SetStateAction<ExamQuestionDraft[]>>;
    duplicateTitle: (value: string) => string;
  },
) {
  actions.setCourseId(exam.courseId ?? '');
  actions.setUnitId(exam.unitId ?? '');
  actions.setTitle(duplicate ? actions.duplicateTitle(exam.title) : exam.title);
  actions.setDescription(exam.description ?? '');
  actions.setDurationMinutes(String(exam.durationMinutes));
  actions.setPassingScore(String(exam.passingScore ?? 60));
  actions.setIsPublished(exam.isPublished);
  actions.setSectionTitle(exam.sections[0]?.title ?? '');
  const questionDrafts = exam.sections.flatMap((section) =>
    section.questions.map((question) => mapExamQuestionToDraft(question)),
  );

  actions.setQuestionDrafts(
    questionDrafts.length > 0 ? questionDrafts : [createExamQuestionDraft()],
  );
}

function mapExamQuestionToDraft(question: Exam['sections'][number]['questions'][number]) {
  let optionsText = '';
  if (question.type === 'MULTIPLE_CHOICE' || question.type === 'ORDERING') {
    optionsText = Array.isArray(question.options)
      ? question.options.map((option) => String(option)).join('\n')
      : '';
  } else if (question.type === 'MATCHING') {
    optionsText = JSON.stringify(question.options, null, 2);
  }

  return {
    ...createExamQuestionDraft(question.type),
    type: question.type,
    prompt: question.prompt,
    optionsText,
    correctAnswer: formatDraftValue(question.correctAnswer),
    points: String(question.points ?? 1),
    skillTags: question.skillTags.join(', '),
    explanation: question.explanation ?? '',
    audioMediaAssetId: question.audioMediaAssetId ?? null,
    audioUrl: question.audioMediaAsset?.url ?? null,
    audioReplayLimit: question.audioReplayLimit ?? null,
  };
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function parsePositiveNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parsePercentage(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}
