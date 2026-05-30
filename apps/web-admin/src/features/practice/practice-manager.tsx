'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { PaginationControls } from '@repo/ui';
import { DraftPreviewCard } from '@/components/authoring/draft-preview-card';
import { QuestionOptionsEditor } from '@/components/authoring/question-options-editor';
import { AiGenerationModal } from '@/components/practice/ai-generation-modal';
import { AudioUploadField } from '@/components/media/audio-upload-field';
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
import { formatDraftValue, parseCsv, parseList } from '@/features/authoring/draft-utils';
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useCreatePracticeExerciseSet,
  useCreatePracticeQuestion,
  useDeletePracticeExerciseSet,
  useDeletePracticeQuestion,
  usePracticeExerciseSetsPage,
  usePracticeExerciseSet,
  usePracticeQuestions,
  useUpdatePracticeExerciseSet,
  useUpdatePracticeQuestion,
  useReviewQueue,
  useApprovePracticeQuestion,
  useRejectPracticeQuestion,
  useBulkApprovePracticeQuestions,
  useBulkRejectPracticeQuestions,
} from '@/hooks/use-practice';
import { useDebounce } from '@/hooks/use-debounce';
import type {
  PracticeExerciseSet,
  PracticeQuestion,
  PracticeQuestionType,
} from '@/lib/practice-api';
import { Link } from '@/navigation';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Dumbbell,
  Loader2,
  Plus,
  PencilLine,
  Trash2,
  X,
  Sparkles,
} from 'lucide-react';

const PRACTICE_LIST_PAGE_SIZE = 10;

interface PracticeManagerProps {
  /** When provided, the manager is locked to this course and the selector is hidden. */
  courseId?: string;
  /** Show the course selector dropdown (standalone page mode). Defaults to true. */
  showCourseSelector?: boolean;
}

export function PracticeManager({
  courseId: lockedCourseId,
  showCourseSelector = true,
}: PracticeManagerProps) {
  const t = useTranslations('Admin');
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [courseId, setCourseId] = useState(lockedCourseId ?? '');
  const [unitId, setUnitId] = useState('');
  const [questionType, setQuestionType] = useState<PracticeQuestionType>('MULTIPLE_CHOICE');
  const [prompt, setPrompt] = useState('');
  const [optionsText, setOptionsText] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [skillTags, setSkillTags] = useState('');
  const [audioMediaAssetId, setAudioMediaAssetId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReplayLimit, setAudioReplayLimit] = useState<number | null>(null);
  const [setTitle, setSetTitle] = useState('');
  const [setDescription, setSetDescription] = useState('');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingExerciseSetId, setEditingExerciseSetId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<PracticeQuestion | null>(null);
  const [exerciseSetToDelete, setExerciseSetToDelete] = useState<PracticeExerciseSet | null>(null);
  const [questionBulkDeleteOpen, setQuestionBulkDeleteOpen] = useState(false);
  const [questionBulkAction, setQuestionBulkAction] = useState<'delete' | null>(null);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'all' | PracticeQuestionType>('all');
  const [questionPage, setQuestionPage] = useState(1);
  const [selectedExerciseSetIds, setSelectedExerciseSetIds] = useState<string[]>([]);
  const [exerciseSetSearch, setExerciseSetSearch] = useState('');
  const [exerciseSetStatusFilter, setExerciseSetStatusFilter] = useState<
    'all' | 'published' | 'draft'
  >('all');
  const [exerciseSetPage, setExerciseSetPage] = useState(1);
  const [exerciseSetBulkDeleteOpen, setExerciseSetBulkDeleteOpen] = useState(false);
  const [exerciseSetBulkAction, setExerciseSetBulkAction] = useState<
    'publish' | 'unpublish' | 'delete' | null
  >(null);

  const [aiGenerationModalOpen, setAiGenerationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'questions' | 'question-editor' | 'sets' | 'set-editor' | 'review-queue'
  >('questions');
  const [selectedReviewIds, setSelectedReviewIds] = useState<string[]>([]);
  const [reviewBulkAction, setReviewBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [reviewQueuePage, setReviewQueuePage] = useState(1);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const selectedUnit = units.find((unit) => unit.id === unitId) ?? null;
  const query = { courseId: courseId || undefined, unitId: unitId || undefined };
  const debouncedQuestionSearch = useDebounce(questionSearch, 300);
  const debouncedExerciseSetSearch = useDebounce(exerciseSetSearch, 300);
  const { data: questionsPageData, isLoading: questionsLoading } = usePracticeQuestions({
    ...query,
    page: questionPage,
    limit: PRACTICE_LIST_PAGE_SIZE,
    search: debouncedQuestionSearch.trim() || undefined,
    questionType: questionTypeFilter === 'all' ? undefined : questionTypeFilter,
  });
  const { data: exerciseSetsPageData, isLoading: setsLoading } = usePracticeExerciseSetsPage({
    ...query,
    page: exerciseSetPage,
    limit: PRACTICE_LIST_PAGE_SIZE,
    search: debouncedExerciseSetSearch.trim() || undefined,
    status: exerciseSetStatusFilter,
  });
  const createQuestion = useCreatePracticeQuestion();
  const updateQuestion = useUpdatePracticeQuestion();
  const deleteQuestion = useDeletePracticeQuestion();
  const createExerciseSet = useCreatePracticeExerciseSet();
  const { data: editingExerciseSet } = usePracticeExerciseSet(editingExerciseSetId ?? '');
  const updateExerciseSet = useUpdatePracticeExerciseSet();
  const deleteExerciseSet = useDeletePracticeExerciseSet();
  const approveQuestion = useApprovePracticeQuestion();
  const rejectQuestion = useRejectPracticeQuestion();
  const bulkApproveQuestions = useBulkApprovePracticeQuestions();
  const bulkRejectQuestions = useBulkRejectPracticeQuestions();
  const { data: reviewQueuePageData, isLoading: reviewQueueLoading } = useReviewQueue({
    ...query,
    page: reviewQueuePage,
    limit: PRACTICE_LIST_PAGE_SIZE,
  });
  const questions = questionsPageData?.data ?? [];
  const questionsTotal = questionsPageData?.meta.total ?? questions.length;
  const questionTotalPages = Math.max(questionsPageData?.meta.totalPages ?? 1, 1);
  const exerciseSets = exerciseSetsPageData?.data ?? [];
  const exerciseSetsTotal = exerciseSetsPageData?.meta.total ?? exerciseSets.length;
  const exerciseSetTotalPages = Math.max(exerciseSetsPageData?.meta.totalPages ?? 1, 1);
  const reviewQueue = reviewQueuePageData?.data ?? [];
  const reviewQueueTotal = reviewQueuePageData?.meta.total ?? reviewQueue.length;
  const reviewQueueTotalPages = Math.max(reviewQueuePageData?.meta.totalPages ?? 1, 1);
  const hasQuestionFilters =
    debouncedQuestionSearch.trim().length > 0 || questionTypeFilter !== 'all';
  const hasExerciseSetFilters =
    debouncedExerciseSetSearch.trim().length > 0 || exerciseSetStatusFilter !== 'all';

  const questionSaving = createQuestion.isPending || updateQuestion.isPending;
  const exerciseSetSaving = createExerciseSet.isPending || updateExerciseSet.isPending;
  const reviewBulkPending = reviewBulkAction !== null;
  const filteredQuestions = questions;
  const filteredExerciseSets = exerciseSets;
  const questionBulkPending = questionBulkAction !== null;
  const exerciseSetBulkPending = exerciseSetBulkAction !== null;
  const questionDraft = useMemo(
    () =>
      buildPracticeQuestionDraft({
        courseId,
        questionType,
        prompt,
        optionsText,
        correctAnswer,
        skillTags,
      }),
    [courseId, correctAnswer, optionsText, prompt, questionType, skillTags],
  );
  const exerciseSetDraft = useMemo(
    () =>
      buildPracticeSetDraft({
        courseId,
        setTitle,
        selectedQuestionCount: selectedQuestionIds.length,
        isPublished,
      }),
    [courseId, isPublished, selectedQuestionIds.length, setTitle],
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
    setSelectedQuestionIds([]);
    setSelectedExerciseSetIds([]);
    setSelectedReviewIds([]);
    setEditingQuestionId(null);
    setEditingExerciseSetId(null);
    setQuestionPage(1);
    setExerciseSetPage(1);
    setReviewQueuePage(1);
  }, [courseId]);

  useEffect(() => {
    if (!editingExerciseSetId || !editingExerciseSet) return;

    setCourseId(editingExerciseSet.courseId ?? '');
    setUnitId(editingExerciseSet.unitId ?? '');
    setSetTitle(editingExerciseSet.title);
    setSetDescription(editingExerciseSet.description ?? '');
    setIsPublished(editingExerciseSet.isPublished);
    setSelectedQuestionIds(editingExerciseSet.questions.map((item) => item.question.id));
  }, [editingExerciseSet, editingExerciseSetId]);

  const resetQuestionDraft = () => {
    setActiveTab('questions');
    setEditingQuestionId(null);
    setQuestionType('MULTIPLE_CHOICE');
    setPrompt('');
    setOptionsText('');
    setCorrectAnswer('');
    setExplanation('');
    setSkillTags('');
    setAudioMediaAssetId(null);
    setAudioUrl(null);
    setAudioReplayLimit(null);
  };

  const resetExerciseSetDraft = () => {
    setActiveTab('sets');
    setEditingExerciseSetId(null);
    setSetTitle('');
    setSetDescription('');
    setSelectedQuestionIds([]);
    setIsPublished(true);
  };

  const handleSubmitQuestion = (event: FormEvent) => {
    event.preventDefault();
    if (!questionDraft.checks.course || !questionDraft.checks.prompt || !correctAnswer.trim()) {
      toast.error(t('practiceRequiredFields'));
      return;
    }

    if (!questionDraft.checks.options) {
      toast.error(t('practiceOptionsRequired'));
      return;
    }

    if (questionType === 'MULTIPLE_CHOICE' && !questionDraft.correctAnswerIsNumeric) {
      toast.error(t('practiceCorrectAnswerIndexRequired'));
      return;
    }

    if (!questionDraft.checks.correctAnswer) {
      toast.error(t('practiceCorrectAnswerIndexRangeRequired'));
      return;
    }

    const payload = {
      unitId: unitId || null,
      type: questionType,
      prompt: prompt.trim(),
      options: questionType === 'MULTIPLE_CHOICE' ? questionDraft.options : undefined,
      correctAnswer: questionDraft.correctAnswerValue,
      explanation: explanation.trim() || null,
      skillTags: questionDraft.skillTags,
      audioMediaAssetId: isAudioPromptQuestionType(questionType) ? audioMediaAssetId : null,
      audioReplayLimit: isAudioPromptQuestionType(questionType) ? audioReplayLimit : null,
    };

    const mutation = editingQuestionId
      ? updateQuestion.mutateAsync({ id: editingQuestionId, payload })
      : createQuestion.mutateAsync({
          courseId,
          unitId: unitId || undefined,
          type: questionType,
          prompt: prompt.trim(),
          options: questionType === 'MULTIPLE_CHOICE' ? questionDraft.options : undefined,
          correctAnswer: questionDraft.correctAnswerValue,
          explanation: explanation.trim() || undefined,
          skillTags: questionDraft.skillTags,
          audioMediaAssetId: isAudioPromptQuestionType(questionType)
            ? (audioMediaAssetId ?? undefined)
            : undefined,
          audioReplayLimit: isAudioPromptQuestionType(questionType)
            ? (audioReplayLimit ?? undefined)
            : undefined,
        });

    mutation
      .then(() => {
        resetQuestionDraft();
        toast.success(
          editingQuestionId ? t('practiceQuestionUpdated') : t('practiceQuestionCreated'),
        );
      })
      .catch(() =>
        toast.error(
          editingQuestionId ? t('practiceQuestionUpdateError') : t('practiceQuestionCreateError'),
        ),
      );
  };

  const handleDuplicateQuestion = (question: PracticeQuestion) => {
    createQuestion.mutate(
      {
        courseId,
        unitId: question.unitId ?? (unitId || undefined),
        type: question.type,
        prompt: question.prompt,
        options: question.type === 'MULTIPLE_CHOICE' ? question.options : undefined,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation ?? undefined,
        skillTags: question.skillTags,
      },
      {
        onSuccess: () => toast.success(t('practiceQuestionDuplicated')),
        onError: () => toast.error(t('practiceQuestionDuplicateError')),
      },
    );
  };

  const handleEditQuestion = (question: PracticeQuestion) => {
    setActiveTab('question-editor');
    setEditingQuestionId(question.id);
    setQuestionType(question.type);
    setPrompt(question.prompt);
    setOptionsText(
      question.type === 'MULTIPLE_CHOICE' && Array.isArray(question.options)
        ? question.options.map((option) => String(option)).join('\n')
        : '',
    );
    setCorrectAnswer(formatDraftValue(question.correctAnswer));
    setExplanation(question.explanation ?? '');
    setSkillTags(question.skillTags.join(', '));
    setUnitId(question.unitId ?? '');
    setAudioMediaAssetId(question.audioMediaAssetId ?? null);
    setAudioUrl(question.audioMediaAsset?.url ?? null);
    setAudioReplayLimit(question.audioReplayLimit ?? null);
    toast.success(t('practiceQuestionLoadedDraft'));
  };

  const handleUseQuestionAsDraft = (question: PracticeQuestion) => {
    setEditingQuestionId(null);
    setQuestionType(question.type);
    setPrompt(question.prompt);
    setOptionsText(
      question.type === 'MULTIPLE_CHOICE' && Array.isArray(question.options)
        ? question.options.map((option) => String(option)).join('\n')
        : '',
    );
    setCorrectAnswer(formatDraftValue(question.correctAnswer));
    setExplanation(question.explanation ?? '');
    setSkillTags(question.skillTags.join(', '));
    setAudioMediaAssetId(question.audioMediaAssetId ?? null);
    setAudioUrl(question.audioMediaAsset?.url ?? null);
    setAudioReplayLimit(question.audioReplayLimit ?? null);
    toast.success(t('practiceQuestionLoadedDraft'));
  };

  const handleDeleteQuestion = (question: PracticeQuestion) => {
    setQuestionToDelete(question);
  };

  const handleBulkDeleteQuestions = async () => {
    if (selectedQuestionIds.length === 0) return;
    const ids = [...selectedQuestionIds];
    setQuestionBulkAction('delete');
    try {
      await Promise.all(ids.map((id) => deleteQuestion.mutateAsync(id)));
      if (editingQuestionId && ids.includes(editingQuestionId)) resetQuestionDraft();
      setSelectedQuestionIds([]);
      setQuestionBulkDeleteOpen(false);
      toast.success(t('bulkQuestionsDeleted', { count: ids.length }));
    } catch {
      toast.error(t('bulkQuestionDeleteError'));
    } finally {
      setQuestionBulkAction(null);
    }
  };

  const selectAllQuestions = () => {
    setSelectedQuestionIds(filteredQuestions.map((question) => question.id));
  };

  const clearSelectedQuestions = () => {
    setSelectedQuestionIds([]);
  };

  const clearQuestionFilters = () => {
    setQuestionSearch('');
    setQuestionTypeFilter('all');
    setQuestionPage(1);
  };

  const handleSubmitExerciseSet = (event: FormEvent) => {
    event.preventDefault();
    if (
      !exerciseSetDraft.checks.course ||
      !exerciseSetDraft.checks.title ||
      selectedQuestionIds.length === 0
    ) {
      toast.error(t('practiceSetRequiredFields'));
      return;
    }

    const payload = {
      unitId: unitId || null,
      title: setTitle.trim(),
      description: setDescription.trim() || null,
      isPublished,
      questionIds: selectedQuestionIds,
    };

    const mutation = editingExerciseSetId
      ? updateExerciseSet.mutateAsync({ id: editingExerciseSetId, payload })
      : createExerciseSet.mutateAsync({
          courseId,
          unitId: unitId || undefined,
          title: setTitle.trim(),
          description: setDescription.trim() || undefined,
          isPublished,
          questionIds: selectedQuestionIds,
        });

    mutation
      .then(() => {
        resetExerciseSetDraft();
        toast.success(editingExerciseSetId ? t('practiceSetUpdated') : t('practiceSetCreated'));
      })
      .catch(() =>
        toast.error(
          editingExerciseSetId ? t('practiceSetUpdateError') : t('practiceSetCreateError'),
        ),
      );
  };

  const handleEditExerciseSet = (set: PracticeExerciseSet) => {
    setActiveTab('set-editor');
    setEditingExerciseSetId(set.id);
  };

  const handleDeleteExerciseSet = (set: PracticeExerciseSet) => {
    setExerciseSetToDelete(set);
  };

  const toggleExerciseSetSelection = (setId: string, checked: boolean) => {
    setSelectedExerciseSetIds((current) =>
      checked
        ? current.includes(setId)
          ? current
          : [...current, setId]
        : current.filter((id) => id !== setId),
    );
  };

  const selectAllExerciseSets = () => {
    setSelectedExerciseSetIds(filteredExerciseSets.map((set) => set.id));
  };

  const clearSelectedExerciseSets = () => {
    setSelectedExerciseSetIds([]);
  };

  const clearExerciseSetFilters = () => {
    setExerciseSetSearch('');
    setExerciseSetStatusFilter('all');
    setExerciseSetPage(1);
  };

  const handleToggleExerciseSetPublished = (set: PracticeExerciseSet) => {
    const nextPublished = !set.isPublished;
    updateExerciseSet.mutate(
      { id: set.id, payload: { isPublished: nextPublished } },
      {
        onSuccess: () =>
          toast.success(nextPublished ? t('practiceSetPublished') : t('practiceSetUnpublished')),
        onError: () => toast.error(t('practiceSetPublishUpdateError')),
      },
    );
  };

  const handleBulkExerciseSetPublish = async (nextPublished: boolean) => {
    if (selectedExerciseSetIds.length === 0) return;
    const ids = [...selectedExerciseSetIds];
    setExerciseSetBulkAction(nextPublished ? 'publish' : 'unpublish');
    try {
      await Promise.all(
        ids.map((id) =>
          updateExerciseSet.mutateAsync({ id, payload: { isPublished: nextPublished } }),
        ),
      );
      setSelectedExerciseSetIds([]);
      toast.success(
        nextPublished
          ? t('bulkPracticeSetsPublished', { count: ids.length })
          : t('bulkPracticeSetsUnpublished', { count: ids.length }),
      );
    } catch {
      toast.error(t('bulkPracticeSetUpdateError'));
    } finally {
      setExerciseSetBulkAction(null);
    }
  };

  const handleBulkDeleteExerciseSets = async () => {
    if (selectedExerciseSetIds.length === 0) return;
    const ids = [...selectedExerciseSetIds];
    setExerciseSetBulkAction('delete');
    try {
      await Promise.all(ids.map((id) => deleteExerciseSet.mutateAsync(id)));
      if (editingExerciseSetId && ids.includes(editingExerciseSetId)) resetExerciseSetDraft();
      setSelectedExerciseSetIds([]);
      setExerciseSetBulkDeleteOpen(false);
      toast.success(t('bulkPracticeSetsDeleted', { count: ids.length }));
    } catch {
      toast.error(t('bulkPracticeSetDeleteError'));
    } finally {
      setExerciseSetBulkAction(null);
    }
  };

  const handleApproveQuestion = (id: string) => {
    approveQuestion.mutate(id, {
      onSuccess: () => toast.success(t('practiceQuestionUpdated')),
      onError: () => toast.error(t('practiceQuestionUpdateError')),
    });
  };

  const handleRejectQuestion = (id: string) => {
    rejectQuestion.mutate(id, {
      onSuccess: () => toast.success(t('practiceQuestionUpdated')),
      onError: () => toast.error(t('practiceQuestionUpdateError')),
    });
  };

  const handleBulkApproveReview = () => {
    if (selectedReviewIds.length === 0) return;
    setReviewBulkAction('approve');
    bulkApproveQuestions.mutate(selectedReviewIds, {
      onSuccess: () => {
        setSelectedReviewIds([]);
        toast.success(t('practiceQuestionUpdated'));
      },
      onError: () => toast.error(t('practiceQuestionUpdateError')),
      onSettled: () => setReviewBulkAction(null),
    });
  };

  const handleBulkRejectReview = () => {
    if (selectedReviewIds.length === 0) return;
    setReviewBulkAction('reject');
    bulkRejectQuestions.mutate(selectedReviewIds, {
      onSuccess: () => {
        setSelectedReviewIds([]);
        toast.success(t('practiceQuestionUpdated'));
      },
      onError: () => toast.error(t('practiceQuestionUpdateError')),
      onSettled: () => setReviewBulkAction(null),
    });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link
            href={courseId ? `/practice/ai-review?courseId=${courseId}` : '/practice/ai-review'}
          >
            <Sparkles className="h-4 w-4" />
            {t('aiReviewOpen')}
          </Link>
        </Button>
      </div>

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
              setSelectedQuestionIds([]);
              setSelectedExerciseSetIds([]);
              setSelectedReviewIds([]);
              setQuestionPage(1);
              setExerciseSetPage(1);
              setReviewQueuePage(1);
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
          <BookOpen className="h-4 w-4" />
          <AlertDescription>{t('practiceSelectCourseFirst')}</AlertDescription>
        </Alert>
      ) : (
        <div>
          <div className="mb-6 border-b border-border">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('questions')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'questions'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('practiceQuestionsTab')}
              </button>
              <button
                onClick={() => setActiveTab('question-editor')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'question-editor'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {editingQuestionId ? t('editPracticeQuestion') : t('createPracticeQuestion')}
              </button>
              <button
                onClick={() => setActiveTab('sets')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'sets'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('exerciseSetsTab')}
              </button>
              <button
                onClick={() => setActiveTab('review-queue')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === 'review-queue'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                {t('reviewQueue')}
                {reviewQueueTotal > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full"
                  >
                    {reviewQueueTotal}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('set-editor')}
                className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === 'set-editor'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {editingExerciseSetId ? t('editExerciseSet') : t('createExerciseSet')}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {activeTab === 'questions' && (
              <section className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{t('questionBank')}</h2>
                    <p className="text-sm text-muted-foreground">{t('questionBankDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{questionsTotal}</Badge>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                      onClick={() => setAiGenerationModalOpen(true)}
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('generateWithAi')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllQuestions}
                      disabled={filteredQuestions.length === 0}
                    >
                      {t('selectAllQuestions')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelectedQuestions}
                      disabled={selectedQuestionIds.length === 0}
                    >
                      {t('clearSelection')}
                    </Button>
                  </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <Input
                    value={questionSearch}
                    onChange={(event) => {
                      setQuestionSearch(event.target.value);
                      setQuestionPage(1);
                    }}
                    placeholder={t('searchQuestions')}
                  />
                  <select
                    value={questionTypeFilter}
                    onChange={(event) => {
                      setQuestionTypeFilter(event.target.value as 'all' | PracticeQuestionType);
                      setQuestionPage(1);
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="all">{t('allQuestionTypes')}</option>
                    <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
                    <option value="FILL_BLANK">{t('fillBlank')}</option>
                    <option value="MATCHING">{t('matching')}</option>
                    <option value="ORDERING">{t('ordering')}</option>
                    <option value="AI_EVALUATED_AUDIO">{t('aiEvaluatedAudio')}</option>
                    <option value="AI_EVALUATED_TEXT">{t('aiEvaluatedText')}</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={clearQuestionFilters}
                    disabled={!questionSearch && questionTypeFilter === 'all'}
                  >
                    {t('clearFilters')}
                  </Button>
                </div>

                {questionsLoading ? (
                  <LoadingRow label={t('loading')} />
                ) : questions.length === 0 ? (
                  <EmptyState
                    title={
                      hasQuestionFilters
                        ? t('noFilteredPracticeQuestions')
                        : t('noPracticeQuestions')
                    }
                  />
                ) : (
                  <>
                    {selectedQuestionIds.length > 0 && (
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                        <span className="text-sm font-medium">
                          {t('selectedItemsValue', { count: selectedQuestionIds.length })}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={questionBulkPending}
                            onClick={() => setQuestionBulkDeleteOpen(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('deleteSelected')}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="divide-y rounded-lg border">
                      {filteredQuestions.map((question) => (
                        <label
                          key={question.id}
                          className="flex cursor-pointer items-start gap-3 px-4 py-3"
                        >
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={selectedQuestionIds.includes(question.id)}
                            onChange={(event) => {
                              setSelectedQuestionIds((current) =>
                                event.target.checked
                                  ? [...current, question.id]
                                  : current.filter((id) => id !== question.id),
                              );
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline">
                                  {question.type === 'MULTIPLE_CHOICE'
                                    ? t('multipleChoice')
                                    : question.type === 'FILL_BLANK'
                                      ? t('fillBlank')
                                      : question.type === 'AI_EVALUATED_AUDIO'
                                        ? t('aiEvaluatedAudio')
                                        : t('aiEvaluatedText')}
                                </Badge>
                                {question.skillTags.map((tag) => (
                                  <Badge key={tag} variant="secondary">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleEditQuestion(question);
                                  }}
                                  title={t('editQuestion')}
                                  aria-label={t('editQuestion')}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleUseQuestionAsDraft(question);
                                  }}
                                  title={t('useQuestionAsDraft')}
                                  aria-label={t('useQuestionAsDraft')}
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleDuplicateQuestion(question);
                                  }}
                                  title={t('duplicateQuestion')}
                                  aria-label={t('duplicateQuestion')}
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    handleDeleteQuestion(question);
                                  }}
                                  title={t('deleteQuestion')}
                                  aria-label={t('deleteQuestion')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <p className="mt-2 text-sm font-medium">{question.prompt}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <PaginationControls
                      page={questionPage}
                      totalPages={questionTotalPages}
                      disabled={questionsLoading}
                      className="mt-4"
                      labels={{
                        previous: t('previousPage'),
                        next: t('nextPage'),
                        pageValue: t('pageValue', {
                          page: questionPage,
                          total: questionTotalPages,
                        }),
                      }}
                      onPageChange={setQuestionPage}
                    />
                  </>
                )}
              </section>
            )}

            {activeTab === 'review-queue' && (
              <section className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{t('reviewQueue')}</h2>
                    <p className="text-sm text-muted-foreground">{t('reviewQueueDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{reviewQueueTotal}</Badge>
                    {reviewQueue.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedReviewIds(reviewQueue.map((q) => q.id))}
                          disabled={reviewQueue.length === 0}
                        >
                          {t('selectAllItems')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReviewIds([])}
                          disabled={selectedReviewIds.length === 0}
                        >
                          {t('clearSelection')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {reviewQueueLoading ? (
                  <LoadingRow label={t('loading')} />
                ) : reviewQueue.length === 0 ? (
                  <EmptyState title={t('noQuestions')} />
                ) : (
                  <div className="grid gap-3">
                    {selectedReviewIds.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                        <span className="text-sm font-medium">
                          {t('selectedItemsValue', { count: selectedReviewIds.length })}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2 text-emerald-600 hover:text-emerald-700"
                            disabled={reviewBulkPending}
                            onClick={handleBulkApproveReview}
                          >
                            {reviewBulkAction === 'approve' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            {t('approveSelected')}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2 text-destructive hover:text-destructive"
                            disabled={reviewBulkPending}
                            onClick={handleBulkRejectReview}
                          >
                            {reviewBulkAction === 'reject' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5" />
                            )}
                            {t('rejectSelected')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {reviewQueue.map((question) => (
                      <label
                        key={question.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                          selectedReviewIds.includes(question.id)
                            ? 'border-primary bg-primary/5'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          aria-label={t('selectItem')}
                          checked={selectedReviewIds.includes(question.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedReviewIds((prev) => [...prev, question.id]);
                            } else {
                              setSelectedReviewIds((prev) =>
                                prev.filter((id) => id !== question.id),
                              );
                            }
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">
                                {getPracticeQuestionTypeLabel(question.type, t)}
                              </Badge>
                              {question.aiGenerated && (
                                <Badge
                                  variant="secondary"
                                  className="gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400"
                                >
                                  <Sparkles className="h-3 w-3" />
                                  {t('aiGenerated')}
                                </Badge>
                              )}
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-emerald-600 hover:text-emerald-700"
                                disabled={approveQuestion.isPending}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleApproveQuestion(question.id);
                                }}
                              >
                                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                {t('approve')}
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 text-destructive hover:text-destructive"
                                disabled={rejectQuestion.isPending}
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleRejectQuestion(question.id);
                                }}
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                {t('reject')}
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 text-sm font-medium">{question.prompt}</p>
                        </div>
                      </label>
                    ))}
                    <PaginationControls
                      page={reviewQueuePage}
                      totalPages={reviewQueueTotalPages}
                      disabled={reviewQueueLoading}
                      labels={{
                        previous: t('previousPage'),
                        next: t('nextPage'),
                        pageValue: t('pageValue', {
                          page: reviewQueuePage,
                          total: reviewQueueTotalPages,
                        }),
                      }}
                      onPageChange={setReviewQueuePage}
                    />
                  </div>
                )}
              </section>
            )}

            {activeTab === 'sets' && (
              <section className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold">{t('exerciseSets')}</h2>
                    <p className="text-sm text-muted-foreground">{t('exerciseSetsDesc')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{exerciseSetsTotal}</Badge>
                    {exerciseSets.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllExerciseSets}
                          disabled={filteredExerciseSets.length === 0}
                        >
                          {t('selectAllItems')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={clearSelectedExerciseSets}
                          disabled={selectedExerciseSetIds.length === 0}
                        >
                          {t('clearSelection')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
                  <Input
                    value={exerciseSetSearch}
                    onChange={(event) => {
                      setExerciseSetSearch(event.target.value);
                      setExerciseSetPage(1);
                    }}
                    placeholder={t('searchExerciseSets')}
                  />
                  <select
                    value={exerciseSetStatusFilter}
                    onChange={(event) => {
                      setExerciseSetStatusFilter(
                        event.target.value as 'all' | 'published' | 'draft',
                      );
                      setExerciseSetPage(1);
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
                    onClick={clearExerciseSetFilters}
                    disabled={!exerciseSetSearch && exerciseSetStatusFilter === 'all'}
                  >
                    {t('clearFilters')}
                  </Button>
                </div>

                {setsLoading ? (
                  <LoadingRow label={t('loading')} />
                ) : exerciseSets.length === 0 ? (
                  <EmptyState
                    title={
                      hasExerciseSetFilters ? t('noFilteredExerciseSets') : t('noExerciseSets')
                    }
                  />
                ) : (
                  <div className="grid gap-3">
                    {selectedExerciseSetIds.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
                        <span className="text-sm font-medium">
                          {t('selectedItemsValue', { count: selectedExerciseSetIds.length })}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            disabled={exerciseSetBulkPending}
                            onClick={() => handleBulkExerciseSetPublish(true)}
                          >
                            {exerciseSetBulkAction === 'publish' ? (
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
                            disabled={exerciseSetBulkPending}
                            onClick={() => handleBulkExerciseSetPublish(false)}
                          >
                            {exerciseSetBulkAction === 'unpublish' ? (
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
                            disabled={exerciseSetBulkPending}
                            onClick={() => setExerciseSetBulkDeleteOpen(true)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {t('deleteSelected')}
                          </Button>
                        </div>
                      </div>
                    )}
                    {filteredExerciseSets.map((set) => (
                      <div key={set.id} className="rounded-lg border p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            className="mt-1"
                            aria-label={t('selectItem')}
                            checked={selectedExerciseSetIds.includes(set.id)}
                            onChange={(event) =>
                              toggleExerciseSetSelection(set.id, event.target.checked)
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">{set.title}</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {set.unit?.title || t('allUnits')}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1">
                                <Badge variant={set.isPublished ? 'success' : 'outline'}>
                                  {set.isPublished ? t('published') : t('draft')}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  disabled={updateExerciseSet.isPending}
                                  onClick={() => handleToggleExerciseSetPublished(set)}
                                  title={set.isPublished ? t('unpublish') : t('publish')}
                                  aria-label={set.isPublished ? t('unpublish') : t('publish')}
                                >
                                  {set.isPublished ? (
                                    <X className="h-3.5 w-3.5" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleEditExerciseSet(set)}
                                  title={t('editExerciseSet')}
                                  aria-label={t('editExerciseSet')}
                                >
                                  <PencilLine className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteExerciseSet(set)}
                                  title={t('deleteExerciseSet')}
                                  aria-label={t('deleteExerciseSet')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {t('questionCount', { count: set._count?.questions ?? 0 })}
                              </span>
                              <span>{t('attemptCount', { count: set._count?.attempts ?? 0 })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <PaginationControls
                      page={exerciseSetPage}
                      totalPages={exerciseSetTotalPages}
                      disabled={setsLoading}
                      labels={{
                        previous: t('previousPage'),
                        next: t('nextPage'),
                        pageValue: t('pageValue', {
                          page: exerciseSetPage,
                          total: exerciseSetTotalPages,
                        }),
                      }}
                      onPageChange={setExerciseSetPage}
                    />
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-6">
            {activeTab === 'question-editor' && (
              <>
                <DraftPreviewCard
                  title={t('practiceQuestionPreview')}
                  ready={questionDraft.isReady}
                  rows={[
                    {
                      label: t('courseName'),
                      value: selectedCourse?.title ?? t('selectCourse'),
                    },
                    { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                    {
                      label: t('questionType'),
                      value: getPracticeQuestionTypeLabel(questionType, t),
                    },
                    {
                      label: t('questionPrompt'),
                      value: prompt.trim() || t('questionPromptPlaceholder'),
                    },
                    {
                      label: t('answerOptions'),
                      value: Array.isArray(questionDraft.options)
                        ? questionDraft.options.length
                        : 0,
                    },
                    {
                      label: t('skillTags'),
                      value: questionDraft.skillTags.length,
                    },
                  ]}
                  checklist={[
                    { label: t('courseName'), ok: questionDraft.checks.course },
                    { label: t('questionPrompt'), ok: questionDraft.checks.prompt },
                    { label: t('answerOptions'), ok: questionDraft.checks.options },
                    { label: t('correctAnswer'), ok: questionDraft.checks.correctAnswer },
                  ]}
                />

                <form onSubmit={handleSubmitQuestion} className="rounded-xl border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">
                      {editingQuestionId ? t('editQuestion') : t('createQuestion')}
                    </h2>
                    {editingQuestionId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={resetQuestionDraft}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t('cancelEdit')}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>{t('questionType')}</Label>
                      <select
                        value={questionType}
                        onChange={(event) =>
                          setQuestionType(event.target.value as PracticeQuestionType)
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
                        <option value="FILL_BLANK">{t('fillBlank')}</option>
                        <option value="MATCHING">{t('matching')}</option>
                        <option value="ORDERING">{t('ordering')}</option>
                        <option value="AI_EVALUATED_AUDIO">{t('aiEvaluatedAudio')}</option>
                        <option value="AI_EVALUATED_TEXT">{t('aiEvaluatedText')}</option>
                      </select>
                      {(questionType === 'AI_EVALUATED_AUDIO' ||
                        questionType === 'AI_EVALUATED_TEXT') && (
                        <p className="text-xs text-muted-foreground">{t('aiQuestionHint')}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label>{t('questionPrompt')}</Label>
                      <textarea
                        value={prompt}
                        onChange={(event) => setPrompt(event.target.value)}
                        className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        placeholder={t('questionPromptPlaceholder')}
                      />
                    </div>

                    <QuestionOptionsEditor
                      type={questionType}
                      optionsText={optionsText}
                      correctAnswer={correctAnswer}
                      onChange={(updates) => {
                        if (updates.optionsText !== undefined) setOptionsText(updates.optionsText);
                        if (updates.correctAnswer !== undefined)
                          setCorrectAnswer(updates.correctAnswer);
                      }}
                      t={t}
                    />
                    {questionType !== 'MULTIPLE_CHOICE' &&
                      questionType !== 'MATCHING' &&
                      questionType !== 'ORDERING' && (
                        <div className="space-y-1.5">
                          <Label>{t('correctAnswer')}</Label>
                          <Input
                            value={correctAnswer}
                            onChange={(event) => setCorrectAnswer(event.target.value)}
                            placeholder={t('correctAnswerTextPlaceholder')}
                          />
                        </div>
                      )}

                    <div className="space-y-1.5">
                      <Label>{t('skillTags')}</Label>
                      <Input
                        value={skillTags}
                        onChange={(event) => setSkillTags(event.target.value)}
                        placeholder={t('skillTagsPlaceholder')}
                      />
                    </div>

                    {isAudioPromptQuestionType(questionType) ? (
                      <AudioUploadField
                        assetId={audioMediaAssetId}
                        audioUrl={audioUrl}
                        replayLimit={audioReplayLimit}
                        onChange={({ assetId, audioUrl: nextAudioUrl, replayLimit }) => {
                          setAudioMediaAssetId(assetId);
                          setAudioUrl(nextAudioUrl);
                          setAudioReplayLimit(replayLimit);
                        }}
                        disabled={questionSaving}
                      />
                    ) : null}

                    <div className="space-y-1.5">
                      <Label>{t('explanation')}</Label>
                      <textarea
                        value={explanation}
                        onChange={(event) => setExplanation(event.target.value)}
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={questionSaving}>
                      {questionSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingQuestionId ? (
                        <PencilLine className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {editingQuestionId ? t('updateQuestion') : t('createQuestion')}
                    </Button>
                  </div>
                </form>
              </>
            )}

            {activeTab === 'set-editor' && (
              <>
                <DraftPreviewCard
                  title={t('exerciseSetPreview')}
                  ready={exerciseSetDraft.isReady}
                  rows={[
                    {
                      label: t('courseName'),
                      value: selectedCourse?.title ?? t('selectCourse'),
                    },
                    { label: t('unit'), value: selectedUnit?.title ?? t('allUnits') },
                    { label: t('status'), value: isPublished ? t('published') : t('draft') },
                    {
                      label: t('exerciseSetTitle'),
                      value: setTitle.trim() || t('exerciseSetTitlePlaceholder'),
                    },
                    {
                      label: t('questionCount', { count: selectedQuestionIds.length }),
                      value: selectedQuestionIds.length,
                    },
                  ]}
                  checklist={[
                    { label: t('courseName'), ok: exerciseSetDraft.checks.course },
                    { label: t('exerciseSetTitle'), ok: exerciseSetDraft.checks.title },
                    {
                      label: t('selectedQuestionsValue', { count: 1 }),
                      ok: exerciseSetDraft.checks.questions,
                    },
                  ]}
                />

                <form onSubmit={handleSubmitExerciseSet} className="rounded-xl border bg-card p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="text-base font-semibold">
                      {editingExerciseSetId ? t('editExerciseSet') : t('createExerciseSet')}
                    </h2>
                    {editingExerciseSetId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={resetExerciseSetDraft}
                      >
                        <X className="h-3.5 w-3.5" />
                        {t('cancelEdit')}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>{t('exerciseSetTitle')}</Label>
                      <Input
                        value={setTitle}
                        onChange={(event) => setSetTitle(event.target.value)}
                        placeholder={t('exerciseSetTitlePlaceholder')}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('description')}</Label>
                      <textarea
                        value={setDescription}
                        onChange={(event) => setSetDescription(event.target.value)}
                        className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                      {t('selectedQuestionsValue', { count: selectedQuestionIds.length })}
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isPublished}
                        onChange={(event) => setIsPublished(event.target.checked)}
                      />
                      {t('publishNow')}
                    </label>
                    <Button type="submit" className="w-full gap-2" disabled={exerciseSetSaving}>
                      {exerciseSetSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingExerciseSetId ? (
                        <PencilLine className="h-4 w-4" />
                      ) : (
                        <Dumbbell className="h-4 w-4" />
                      )}
                      {editingExerciseSetId ? t('updateExerciseSet') : t('createExerciseSet')}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </aside>
        </div>
      )}
      <DeleteConfirmDialog
        open={Boolean(questionToDelete)}
        title={t('deleteQuestion')}
        description={t('confirmDeleteQuestion')}
        confirmLabel={t('deleteQuestion')}
        cancelLabel={t('cancel')}
        pending={deleteQuestion.isPending}
        onOpenChange={(open) => {
          if (!open) setQuestionToDelete(null);
        }}
        onConfirm={() => {
          if (!questionToDelete) return;
          deleteQuestion.mutate(questionToDelete.id, {
            onSuccess: () => {
              if (editingQuestionId === questionToDelete.id) resetQuestionDraft();
              setQuestionToDelete(null);
              toast.success(t('practiceQuestionDeleted'));
            },
            onError: () => toast.error(t('practiceQuestionDeleteError')),
          });
        }}
      />
      <DeleteConfirmDialog
        open={Boolean(exerciseSetToDelete)}
        title={t('deleteExerciseSet')}
        description={t('confirmDeleteExerciseSet')}
        confirmLabel={t('deleteExerciseSet')}
        cancelLabel={t('cancel')}
        pending={deleteExerciseSet.isPending}
        onOpenChange={(open) => {
          if (!open) setExerciseSetToDelete(null);
        }}
        onConfirm={() => {
          if (!exerciseSetToDelete) return;
          deleteExerciseSet.mutate(exerciseSetToDelete.id, {
            onSuccess: () => {
              if (editingExerciseSetId === exerciseSetToDelete.id) resetExerciseSetDraft();
              setExerciseSetToDelete(null);
              toast.success(t('practiceSetDeleted'));
            },
            onError: () => toast.error(t('practiceSetDeleteError')),
          });
        }}
      />
      <DeleteConfirmDialog
        open={questionBulkDeleteOpen}
        title={t('deleteSelected')}
        description={t('confirmBulkDeleteQuestions', { count: selectedQuestionIds.length })}
        confirmLabel={t('deleteSelected')}
        cancelLabel={t('cancel')}
        pending={questionBulkAction === 'delete'}
        onOpenChange={setQuestionBulkDeleteOpen}
        onConfirm={handleBulkDeleteQuestions}
      />
      <DeleteConfirmDialog
        open={exerciseSetBulkDeleteOpen}
        title={t('deleteSelected')}
        description={t('confirmBulkDeleteExerciseSets', {
          count: selectedExerciseSetIds.length,
        })}
        confirmLabel={t('deleteSelected')}
        cancelLabel={t('cancel')}
        pending={exerciseSetBulkAction === 'delete'}
        onOpenChange={setExerciseSetBulkDeleteOpen}
        onConfirm={handleBulkDeleteExerciseSets}
      />

      <AiGenerationModal
        open={aiGenerationModalOpen}
        onOpenChange={setAiGenerationModalOpen}
        courseId={courseId}
        unitId={unitId || undefined}
        onError={(msg) => toast.error(msg)}
        onSuccess={(msg) => toast.success(msg)}
        onGenerated={() => {
          // Questions are now saved by the backend in PENDING_REVIEW state.
          // They will appear in the Review Queue.
          // Invalidate the questions query in case we want to show a toast or transition
        }}
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

function buildPracticeQuestionDraft(params: {
  courseId: string;
  questionType: PracticeQuestionType;
  prompt: string;
  optionsText: string;
  correctAnswer: string;
  skillTags: string;
}) {
  const options = parseList(params.optionsText);
  const skillTags = parseCsv(params.skillTags);
  const hasCorrectAnswer = params.correctAnswer.trim().length > 0;
  const correctAnswerIndex = Number(params.correctAnswer);
  const correctAnswerIsNumeric = hasCorrectAnswer && Number.isInteger(correctAnswerIndex);

  let parsedOptions: unknown = options;
  let finalCorrectAnswer: unknown = params.correctAnswer.trim();
  let correctAnswerValid = false;
  let optionsValid = true;

  if (params.questionType === 'MULTIPLE_CHOICE') {
    correctAnswerValid =
      correctAnswerIsNumeric && correctAnswerIndex >= 0 && correctAnswerIndex < options.length;
    finalCorrectAnswer = correctAnswerIndex;
    optionsValid = options.length >= 2;
  } else if (params.questionType === 'MATCHING') {
    const matchingOptions = parseMatchingOptions(params.optionsText) as {
      left: string[];
      right: string[];
    } | null;
    parsedOptions = matchingOptions;
    optionsValid =
      Boolean(matchingOptions) &&
      Array.isArray(matchingOptions?.left) &&
      Array.isArray(matchingOptions?.right);
    finalCorrectAnswer = parseMatchingAnswer(params.correctAnswer);
    correctAnswerValid = Boolean(finalCorrectAnswer) && typeof finalCorrectAnswer === 'object';
  } else if (params.questionType === 'ORDERING') {
    parsedOptions = options;
    optionsValid = options.length >= 2;
    const orderingAnswer = parseOrderingAnswer(params.correctAnswer);
    finalCorrectAnswer = orderingAnswer;
    correctAnswerValid = Array.isArray(orderingAnswer);
  } else {
    correctAnswerValid = hasCorrectAnswer;
    parsedOptions = undefined;
  }

  const checks = {
    course: Boolean(params.courseId),
    prompt: params.prompt.trim().length > 0,
    options: optionsValid,
    correctAnswer: correctAnswerValid,
  };

  return {
    options: parsedOptions,
    skillTags,
    correctAnswerValue: finalCorrectAnswer,
    correctAnswerIsNumeric,
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function buildPracticeSetDraft(params: {
  courseId: string;
  setTitle: string;
  selectedQuestionCount: number;
  isPublished: boolean;
}) {
  const checks = {
    course: Boolean(params.courseId),
    title: params.setTitle.trim().length > 0,
    questions: params.selectedQuestionCount > 0,
  };

  return {
    isPublished: params.isPublished,
    checks,
    isReady: Object.values(checks).every(Boolean),
  };
}

function isAudioPromptQuestionType(type: PracticeQuestionType) {
  return type !== 'AI_EVALUATED_AUDIO' && type !== 'AI_EVALUATED_TEXT';
}

function getPracticeQuestionTypeLabel(
  type: PracticeQuestionType,
  t: ReturnType<typeof useTranslations<'Admin'>>,
) {
  if (type === 'MULTIPLE_CHOICE') return t('multipleChoice');
  if (type === 'FILL_BLANK') return t('fillBlank');
  if (type === 'MATCHING') return t('matching');
  if (type === 'ORDERING') return t('ordering');
  if (type === 'AI_EVALUATED_AUDIO') return t('aiEvaluatedAudio');
  return t('aiEvaluatedText');
}
