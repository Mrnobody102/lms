'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { PaginationControls } from '@repo/ui';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import {
  AlertDialog,
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
import { useCourse, useCourses } from '@/hooks/use-courses';
import {
  useAiGeneration,
  useAiGenerations,
  useApproveAiDraft,
  useBulkApproveAiDrafts,
  useBulkRejectAiDrafts,
  useCreateAiGeneration,
  useRejectAiDraft,
  useUpdateAiDraft,
} from '@/hooks/use-practice';
import type {
  AiGeneratedQuestionDraft,
  AiGenerationJobStatus,
  AiQuestionGenerationJob,
  PracticeQuestionType,
} from '@/lib/practice-api';
import { CheckCircle2, Loader2, PencilLine, Sparkles, XCircle } from 'lucide-react';

const QUESTION_TYPES: PracticeQuestionType[] = [
  'MULTIPLE_CHOICE',
  'FILL_BLANK',
  'MATCHING',
  'ORDERING',
  'AI_EVALUATED_TEXT',
  'AI_EVALUATED_AUDIO',
];

const JOB_STATUSES: Array<'all' | AiGenerationJobStatus> = [
  'all',
  'QUEUED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
];
const AI_JOBS_PAGE_SIZE = 20;

interface DraftEditState {
  prompt: string;
  explanation: string;
}

type AdminTranslations = ReturnType<typeof useTranslations<'Admin'>>;

export default function PracticeAiReviewPage() {
  const t = useTranslations('Admin');
  const { data: courseData, isLoading: coursesLoading } = useCourses({ limit: 100 });
  const courses = useMemo(() => courseData?.data ?? [], [courseData]);
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [status, setStatus] = useState<'all' | AiGenerationJobStatus>('all');
  const [jobsPage, setJobsPage] = useState(1);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [count, setCount] = useState(5);
  const [questionType, setQuestionType] = useState<PracticeQuestionType>('MULTIPLE_CHOICE');
  const [skillTags, setSkillTags] = useState('');
  const [editingDraftId, setEditingDraftId] = useState('');
  const [draftEdit, setDraftEdit] = useState<DraftEditState>({ prompt: '', explanation: '' });
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [rejectDraftIds, setRejectDraftIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: selectedCourse } = useCourse(courseId);
  const units = selectedCourse?.units ?? [];
  const jobsQuery = useAiGenerations({
    courseId: courseId || undefined,
    unitId: unitId || undefined,
    status: status === 'all' ? undefined : status,
    page: jobsPage,
    limit: AI_JOBS_PAGE_SIZE,
  });
  const jobs = useMemo(() => jobsQuery.data?.data ?? [], [jobsQuery.data?.data]);
  const jobsTotal = jobsQuery.data?.meta.total ?? jobs.length;
  const jobsTotalPages = Math.max(jobsQuery.data?.meta.totalPages ?? 1, 1);
  const selectedJobQuery = useAiGeneration(selectedJobId);
  const selectedJob = selectedJobQuery.data;

  useEffect(() => {
    if (!courseId && courses[0]?.id) {
      setCourseId(courses[0].id);
    }
  }, [courseId, courses]);

  useEffect(() => {
    setUnitId('');
    setSelectedJobId('');
    setJobsPage(1);
  }, [courseId]);

  useEffect(() => {
    if (!selectedJobId && jobs[0]?.id) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    setSelectedDraftIds([]);
    setEditingDraftId('');
  }, [selectedJobId]);

  const createJob = useCreateAiGeneration();
  const updateDraft = useUpdateAiDraft();
  const approveDraft = useApproveAiDraft();
  const rejectDraft = useRejectAiDraft();
  const bulkApproveDrafts = useBulkApproveAiDrafts();
  const bulkRejectDrafts = useBulkRejectAiDrafts();

  const handleCreateJob = (event: FormEvent) => {
    event.preventDefault();
    if (!courseId || !topic.trim()) {
      setMessage({ type: 'error', text: t('aiReviewRequiredFields') });
      return;
    }

    createJob.mutate(
      {
        courseId,
        unitId: unitId || undefined,
        topic: topic.trim(),
        context: context.trim() || undefined,
        count,
        questionType,
        skillTags: parseSkillTags(skillTags),
      },
      {
        onSuccess: (job) => {
          setJobsPage(1);
          setSelectedJobId(job.id);
          setTopic('');
          setContext('');
          setMessage({ type: 'success', text: t('aiReviewJobCreated') });
        },
        onError: () => setMessage({ type: 'error', text: t('aiReviewJobCreateError') }),
      },
    );
  };

  const startEditing = (draft: AiGeneratedQuestionDraft) => {
    setEditingDraftId(draft.id);
    setDraftEdit({
      prompt: draft.prompt,
      explanation: draft.explanation ?? '',
    });
  };

  const handleSaveDraft = (draft: AiGeneratedQuestionDraft) => {
    updateDraft.mutate(
      {
        id: draft.id,
        payload: {
          prompt: draftEdit.prompt.trim(),
          explanation: draftEdit.explanation.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setEditingDraftId('');
          setMessage({ type: 'success', text: t('aiReviewDraftUpdated') });
        },
        onError: () => setMessage({ type: 'error', text: t('aiReviewDraftUpdateError') }),
      },
    );
  };

  const handleApprove = (draft: AiGeneratedQuestionDraft) => {
    approveDraft.mutate(draft.id, {
      onSuccess: () => {
        setSelectedDraftIds((ids) => ids.filter((id) => id !== draft.id));
        setMessage({ type: 'success', text: t('aiReviewDraftApproved') });
      },
      onError: () => setMessage({ type: 'error', text: t('aiReviewDraftApproveError') }),
    });
  };

  const handleBulkApprove = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    bulkApproveDrafts.mutate(ids, {
      onSuccess: (result) => {
        setSelectedDraftIds([]);
        setMessage({
          type: 'success',
          text: t('aiReviewBulkApproved', { count: result.approved, failed: result.failed }),
        });
      },
      onError: () => setMessage({ type: 'error', text: t('aiReviewBulkApproveError') }),
    });
  };

  const openRejectDialog = (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    setRejectDraftIds(ids);
    setRejectionReason('');
  };

  const closeRejectDialog = () => {
    setRejectDraftIds([]);
    setRejectionReason('');
  };

  const submitReject = () => {
    const reason = rejectionReason.trim();
    if (!reason) {
      setMessage({ type: 'error', text: t('aiReviewRejectReasonRequired') });
      return;
    }

    if (rejectDraftIds.length === 1) {
      const id = rejectDraftIds[0];
      if (!id) {
        return;
      }

      rejectDraft.mutate(
        { id, rejectionReason: reason },
        {
          onSuccess: () => {
            setSelectedDraftIds((ids) => ids.filter((selectedId) => selectedId !== id));
            closeRejectDialog();
            setMessage({ type: 'success', text: t('aiReviewDraftRejected') });
          },
          onError: () => setMessage({ type: 'error', text: t('aiReviewDraftRejectError') }),
        },
      );
      return;
    }

    bulkRejectDrafts.mutate(
      { ids: rejectDraftIds, rejectionReason: reason },
      {
        onSuccess: (result) => {
          setSelectedDraftIds([]);
          closeRejectDialog();
          setMessage({
            type: 'success',
            text: t('aiReviewBulkRejected', { count: result.rejected }),
          });
        },
        onError: () => setMessage({ type: 'error', text: t('aiReviewBulkRejectError') }),
      },
    );
  };

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-[var(--admin-sidebar-width)] lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader title={t('aiReviewTitle')} description={t('aiReviewDesc')} />

            {message ? (
              <div
                className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  message.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-destructive/20 bg-destructive/5 text-destructive'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                {message.text}
              </div>
            ) : null}

            <div className="mb-6 grid gap-4 lg:grid-cols-3">
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
              <div className="space-y-1.5">
                <Label>{t('unit')}</Label>
                <select
                  value={unitId}
                  onChange={(event) => {
                    setUnitId(event.target.value);
                    setSelectedJobId('');
                    setJobsPage(1);
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
              <div className="space-y-1.5">
                <Label>{t('aiReviewStatus')}</Label>
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as 'all' | AiGenerationJobStatus);
                    setSelectedJobId('');
                    setJobsPage(1);
                  }}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {JOB_STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item === 'all' ? t('allStatuses') : t(`aiReviewJobStatus.${item}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
              <section className="rounded-lg border bg-card p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{t('aiReviewJobs')}</h2>
                    <p className="text-sm text-muted-foreground">{t('aiReviewJobsDesc')}</p>
                  </div>
                  <Badge variant="secondary">{jobsTotal}</Badge>
                </div>

                <form
                  className="mb-5 space-y-3 rounded-lg border bg-muted/20 p-3"
                  onSubmit={handleCreateJob}
                >
                  <div className="space-y-1.5">
                    <Label>{t('aiTopic')}</Label>
                    <Input
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      placeholder={t('aiTopicPlaceholder')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>{t('aiQuestionCount')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={count}
                        onChange={(event) => setCount(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t('aiQuestionType')}</Label>
                      <select
                        value={questionType}
                        onChange={(event) =>
                          setQuestionType(event.target.value as PracticeQuestionType)
                        }
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        {QUESTION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {getPracticeQuestionTypeLabel(type, t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('aiSkillTags')}</Label>
                    <Input
                      value={skillTags}
                      onChange={(event) => setSkillTags(event.target.value)}
                      placeholder={t('aiSkillTagsPlaceholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t('aiContext')}</Label>
                    <textarea
                      value={context}
                      onChange={(event) => setContext(event.target.value)}
                      placeholder={t('aiContextPlaceholder')}
                      className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createJob.isPending || !courseId}
                    className="w-full gap-2"
                  >
                    {createJob.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {t('aiReviewCreateJob')}
                  </Button>
                </form>

                <div className="space-y-2">
                  {jobsQuery.isLoading ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">{t('loading')}</p>
                  ) : jobs.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      {t('aiReviewNoJobs')}
                    </p>
                  ) : (
                    <>
                      {jobs.map((job) => (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelectedJobId(job.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            selectedJobId === job.id
                              ? 'border-primary bg-primary/5'
                              : 'bg-background hover:border-primary/40'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-1 text-sm font-semibold">{job.topic}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {job.requestedCount} ·{' '}
                                {getPracticeQuestionTypeLabel(job.questionType, t)}
                              </p>
                            </div>
                            <StatusBadge
                              label={getJobStatusLabel(job.status, t)}
                              status={job.status}
                            />
                          </div>
                        </button>
                      ))}
                      <PaginationControls
                        page={jobsPage}
                        totalPages={jobsTotalPages}
                        disabled={jobsQuery.isLoading}
                        className="pt-2"
                        labels={{
                          previous: t('previousPage'),
                          next: t('nextPage'),
                          pageValue: t('pageValue', { page: jobsPage, total: jobsTotalPages }),
                        }}
                        onPageChange={(nextPage) => {
                          setJobsPage(nextPage);
                          setSelectedJobId('');
                        }}
                      />
                    </>
                  )}
                </div>
              </section>

              <section className="rounded-lg border bg-card p-4">
                {!selectedJobId ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {t('aiReviewSelectJob')}
                  </p>
                ) : selectedJobQuery.isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedJob ? (
                  <JobDetail
                    job={selectedJob}
                    editingDraftId={editingDraftId}
                    draftEdit={draftEdit}
                    selectedDraftIds={selectedDraftIds}
                    setDraftEdit={setDraftEdit}
                    setSelectedDraftIds={setSelectedDraftIds}
                    onStartEditing={startEditing}
                    onCancelEditing={() => setEditingDraftId('')}
                    onSaveDraft={handleSaveDraft}
                    onApprove={handleApprove}
                    onBulkApprove={handleBulkApprove}
                    onReject={(draft) => openRejectDialog([draft.id])}
                    onBulkReject={openRejectDialog}
                    pending={
                      updateDraft.isPending ||
                      approveDraft.isPending ||
                      rejectDraft.isPending ||
                      bulkApproveDrafts.isPending ||
                      bulkRejectDrafts.isPending
                    }
                    t={t}
                  />
                ) : (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    {t('aiReviewJobLoadError')}
                  </p>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      <RejectDraftDialog
        count={rejectDraftIds.length}
        open={rejectDraftIds.length > 0}
        pending={rejectDraft.isPending || bulkRejectDrafts.isPending}
        reason={rejectionReason}
        setReason={setRejectionReason}
        onCancel={closeRejectDialog}
        onSubmit={submitReject}
        t={t}
      />
    </AuthGuard>
  );
}

function JobDetail({
  job,
  editingDraftId,
  draftEdit,
  selectedDraftIds,
  setDraftEdit,
  setSelectedDraftIds,
  onStartEditing,
  onCancelEditing,
  onSaveDraft,
  onApprove,
  onBulkApprove,
  onReject,
  onBulkReject,
  pending,
  t,
}: {
  job: AiQuestionGenerationJob;
  editingDraftId: string;
  draftEdit: DraftEditState;
  selectedDraftIds: string[];
  setDraftEdit: (value: DraftEditState) => void;
  setSelectedDraftIds: (value: string[] | ((current: string[]) => string[])) => void;
  onStartEditing: (draft: AiGeneratedQuestionDraft) => void;
  onCancelEditing: () => void;
  onSaveDraft: (draft: AiGeneratedQuestionDraft) => void;
  onApprove: (draft: AiGeneratedQuestionDraft) => void;
  onBulkApprove: (ids: string[]) => void;
  onReject: (draft: AiGeneratedQuestionDraft) => void;
  onBulkReject: (ids: string[]) => void;
  pending: boolean;
  t: AdminTranslations;
}) {
  const drafts = job.drafts ?? [];
  const pendingDraftIds = drafts
    .filter((draft) => draft.reviewStatus === 'PENDING_REVIEW')
    .map((draft) => draft.id);
  const selectedPendingDraftIds = selectedDraftIds.filter((id) => pendingDraftIds.includes(id));
  const allPendingSelected =
    pendingDraftIds.length > 0 && pendingDraftIds.every((id) => selectedDraftIds.includes(id));

  const toggleDraftSelection = (id: string, checked: boolean) => {
    setSelectedDraftIds((current) =>
      checked ? Array.from(new Set([...current, id])) : current.filter((draftId) => draftId !== id),
    );
  };

  const toggleAllPendingDrafts = (checked: boolean) => {
    setSelectedDraftIds(checked ? pendingDraftIds : []);
  };

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 border-b pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-lg font-semibold">{job.topic}</h2>
            <StatusBadge label={getJobStatusLabel(job.status, t)} status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {job.course?.title ?? job.courseId}
            {job.unit ? ` · ${job.unit.title}` : ''}
          </p>
          {job.errorMessage ? (
            <p className="mt-2 text-sm text-destructive">{job.errorMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingDraftIds.length > 0 ? (
            <>
              <label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input
                  type="checkbox"
                  checked={allPendingSelected}
                  onChange={(event) => toggleAllPendingDrafts(event.target.checked)}
                  className="h-4 w-4 rounded border-input"
                  aria-label={t('selectAllItems')}
                />
                {t('selectAllItems')}
              </label>
              <Button
                size="sm"
                onClick={() => onBulkApprove(selectedPendingDraftIds)}
                disabled={selectedPendingDraftIds.length === 0 || pending}
              >
                {t('approveSelected')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onBulkReject(selectedPendingDraftIds)}
                disabled={selectedPendingDraftIds.length === 0 || pending}
              >
                {t('rejectSelected')}
              </Button>
            </>
          ) : null}
          <Badge variant="secondary">{t('aiReviewDraftCount', { count: drafts.length })}</Badge>
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">{t('aiReviewNoDrafts')}</p>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const isEditing = editingDraftId === draft.id;
            const isPending = draft.reviewStatus === 'PENDING_REVIEW';
            const isSelected = selectedDraftIds.includes(draft.id);

            return (
              <article key={draft.id} className="rounded-lg border bg-background p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {isPending ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(event) => toggleDraftSelection(draft.id, event.target.checked)}
                          className="h-4 w-4 rounded border-input"
                          aria-label={t('selectItem')}
                        />
                      ) : null}
                      <Badge variant="outline">{getPracticeQuestionTypeLabel(draft.type, t)}</Badge>
                      <DraftStatusBadge
                        label={getDraftStatusLabel(draft.reviewStatus, t)}
                        status={draft.reviewStatus}
                      />
                      {draft.skillTags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea
                          value={draftEdit.prompt}
                          onChange={(event) =>
                            setDraftEdit({ ...draftEdit, prompt: event.target.value })
                          }
                          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                        <textarea
                          value={draftEdit.explanation}
                          onChange={(event) =>
                            setDraftEdit({ ...draftEdit, explanation: event.target.value })
                          }
                          placeholder={t('practiceExplanationPlaceholder')}
                          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm font-medium">{draft.prompt}</p>
                        {draft.explanation ? (
                          <p className="mt-2 text-sm text-muted-foreground">{draft.explanation}</p>
                        ) : null}
                        {draft.validationIssues ? (
                          <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
                            <p className="mb-1 font-semibold">{t('aiReviewValidationIssues')}</p>
                            <pre className="max-h-40 overflow-auto whitespace-pre-wrap">
                              {formatJson(draft.validationIssues)}
                            </pre>
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => onSaveDraft(draft)} disabled={pending}>
                        {t('save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onCancelEditing}
                        disabled={pending}
                      >
                        {t('cancel')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStartEditing(draft)}
                        disabled={!isPending || pending}
                        className="gap-2"
                      >
                        <PencilLine className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onApprove(draft)}
                        disabled={!isPending || pending}
                      >
                        {t('approve')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onReject(draft)}
                        disabled={!isPending || pending}
                      >
                        {t('reject')}
                      </Button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RejectDraftDialog({
  count,
  open,
  pending,
  reason,
  setReason,
  onCancel,
  onSubmit,
  t,
}: {
  count: number;
  open: boolean;
  pending: boolean;
  reason: string;
  setReason: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
  t: AdminTranslations;
}) {
  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => (!nextOpen ? onCancel() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('aiReviewRejectTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('aiReviewRejectDesc', { count })}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label>{t('aiReviewRejectReason')}</Label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder={t('aiReviewRejectReasonPrompt')}
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <AlertDialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            {t('cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={onSubmit} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('reject')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatusBadge({ label, status }: { label: string; status: AiGenerationJobStatus }) {
  const variant =
    status === 'COMPLETED' ? 'default' : status === 'FAILED' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}

function DraftStatusBadge({
  label,
  status,
}: {
  label: string;
  status: AiGeneratedQuestionDraft['reviewStatus'];
}) {
  const variant =
    status === 'APPROVED' ? 'default' : status === 'REJECTED' ? 'destructive' : 'secondary';
  return <Badge variant={variant}>{label}</Badge>;
}

function parseSkillTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getJobStatusLabel(status: AiGenerationJobStatus, t: AdminTranslations) {
  if (status === 'QUEUED') return t('aiReviewJobStatus.QUEUED');
  if (status === 'RUNNING') return t('aiReviewJobStatus.RUNNING');
  if (status === 'COMPLETED') return t('aiReviewJobStatus.COMPLETED');
  if (status === 'FAILED') return t('aiReviewJobStatus.FAILED');
  return t('aiReviewJobStatus.CANCELLED');
}

function getDraftStatusLabel(
  status: AiGeneratedQuestionDraft['reviewStatus'],
  t: AdminTranslations,
) {
  if (status === 'PENDING_REVIEW') return t('aiReviewDraftStatus.PENDING_REVIEW');
  if (status === 'APPROVED') return t('aiReviewDraftStatus.APPROVED');
  return t('aiReviewDraftStatus.REJECTED');
}

function getPracticeQuestionTypeLabel(type: PracticeQuestionType, t: AdminTranslations) {
  if (type === 'MULTIPLE_CHOICE') return t('multipleChoice');
  if (type === 'FILL_BLANK') return t('fillBlank');
  if (type === 'MATCHING') return t('matching');
  if (type === 'ORDERING') return t('ordering');
  if (type === 'AI_EVALUATED_AUDIO') return t('aiEvaluatedAudio');
  return t('aiEvaluatedText');
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
