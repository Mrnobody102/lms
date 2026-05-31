'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson, LessonType } from '@/lib/course-api';
import { useExams } from '@/hooks/use-exams';
import { usePracticeExerciseSets } from '@/hooks/use-practice';
import { Button, Input, Label } from '@/components/ui';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Save,
  Video,
  Zap,
} from 'lucide-react';
import {
  isLessonDraftReady,
  parseMicroCardContent,
  serializeMicroCardContent,
  createEmptyMicroCardDraft,
  LessonTypeFields,
  MicroCardDraft,
} from './lesson-type-fields';

interface LessonEditorProps {
  courseId: string;
  lesson?: Lesson | null;
  units?: CourseUnit[];
  lessons?: Lesson[];
  initialUnitId?: string | null;
  nextOrder?: number;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

const LESSON_TYPE_META: Record<
  LessonType,
  { icon: React.ElementType; color: string; labelKey: string }
> = {
  video: { icon: Video, color: 'text-blue-500', labelKey: 'lessonTypeVideo' },
  text: { icon: FileText, color: 'text-emerald-500', labelKey: 'lessonTypeText' },
  quiz: { icon: CheckCircle2, color: 'text-violet-500', labelKey: 'lessonTypeQuiz' },
  practice: { icon: Zap, color: 'text-amber-500', labelKey: 'lessonTypePractice' },
  exam: { icon: CheckCircle2, color: 'text-purple-500', labelKey: 'lessonTypeExam' },
  simulation: { icon: BookOpen, color: 'text-rose-500', labelKey: 'lessonTypeSimulation' },
  micro_card: { icon: Clock, color: 'text-cyan-500', labelKey: 'lessonTypeMicroCard' },
} as const;

export function LessonEditor({
  courseId,
  lesson,
  units = [],
  initialUnitId,
  nextOrder,
  onSubmit,
  onCancel,
  saving,
}: LessonEditorProps) {
  const t = useTranslations('Admin');
  const isEditing = !!lesson;
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonType>('text');
  const [duration, setDuration] = useState(10);
  const [unitId, setUnitId] = useState<string | null>(initialUnitId ?? units[0]?.id ?? null);
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [microCards, setMicroCards] = useState([createEmptyMicroCardDraft()]);
  const [practiceExerciseSetId, setPracticeExerciseSetId] = useState('');
  const [examId, setExamId] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: practiceExerciseSets = [] } = usePracticeExerciseSets();
  const { data: exams = [] } = useExams();

  const attachablePracticeExerciseSets = practiceExerciseSets.filter(
    (set) => !set.courseId || set.courseId === courseId,
  );
  const attachableExams = exams.filter((exam) => !exam.courseId || exam.courseId === courseId);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setType(lesson.type);
      setDuration(lesson.duration);
      setUnitId(lesson.unitId ?? null);
      setContent(lesson.content ?? '');
      setVideoUrl(lesson.videoUrl ?? '');
      setAiPrompt(lesson.aiPrompt ?? '');
      setMicroCards(parseMicroCardContent(lesson.content));
      setPracticeExerciseSetId(lesson.practiceExerciseSetId ?? '');
      setExamId(lesson.examId ?? '');
    } else {
      titleRef.current?.focus();
    }
  }, [lesson]);

  // Auto-calculate text duration based on word count
  useEffect(() => {
    if (type === 'text' && content) {
      // Strip HTML tags and count words
      const plainText = content.replace(/<[^>]*>?/gm, '');
      const wordCount = plainText.split(/\s+/).filter((w) => w.length > 0).length;
      const estimated = Math.max(1, Math.ceil(wordCount / 150)); // 150 words/min
      setDuration(estimated);
    }
  }, [content, type]);

  // Mark dirty when any field changes
  useEffect(() => {
    setIsDirty(true);
  }, [
    title,
    type,
    duration,
    unitId,
    content,
    videoUrl,
    aiPrompt,
    microCards,
    practiceExerciseSetId,
    examId,
  ]);

  const handleSubmit = async () => {
    if (
      !isLessonDraftReady({
        type,
        title,
        content,
        videoUrl,
        aiPrompt,
        microCards,
        practiceExerciseSetId,
        examId,
      })
    ) {
      return;
    }

    const payload: Partial<Lesson> = {
      title,
      type,
      duration,
      unitId,
      content:
        type === 'text'
          ? content.trim()
          : type === 'micro_card'
            ? serializeMicroCardContent(microCards as MicroCardDraft[])
            : null,
      practiceExerciseSetId: type === 'practice' ? practiceExerciseSetId : null,
      examId: type === 'exam' ? examId : null,
      videoUrl: type === 'video' ? videoUrl.trim() : null,
      aiPrompt: type === 'simulation' ? aiPrompt.trim() : null,
    };

    if (!isEditing && nextOrder !== undefined) {
      payload.order = nextOrder;
    }

    const success = await onSubmit(payload);
    if (success) {
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const isReady = isLessonDraftReady({
    type,
    title,
    content,
    videoUrl,
    aiPrompt,
    microCards,
    practiceExerciseSetId,
    examId,
  });
  const typeMeta = LESSON_TYPE_META[type];
  const TypeIcon = typeMeta.icon;

  const lessonTypes: LessonType[] = [
    'text',
    'video',
    'quiz',
    'practice',
    'exam',
    'simulation',
    'micro_card',
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-muted/30">
      {/* ═══ STICKY TOP NAVIGATION BAR ═══ */}
      <header className="shrink-0 z-30 bg-background/80 backdrop-blur-xl border-b shadow-sm">
        <div className="flex h-14 items-center gap-3 px-4 lg:px-6">
          {/* Back */}
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t('backToList')}</span>
          </button>

          <div className="h-5 w-px bg-border" />

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <Link
              href={`/courses/${courseId}/edit`}
              className="hover:text-foreground transition-colors truncate max-w-[120px]"
            >
              {t('curriculumTab')}
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">
              {isEditing ? t('editLessonTitle') : t('addLessonTitle')}
            </span>
          </nav>

          {/* Lesson title editable */}
          <div className="flex-1 min-w-0 hidden md:flex items-center">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('lessonTitlePlaceholder')}
              className="w-full bg-transparent text-sm font-semibold text-foreground border-none outline-none focus:ring-2 focus:ring-primary/20 rounded px-2 truncate"
            />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 shrink-0">
            {saveSuccess ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('saved')}
              </span>
            ) : isDirty && isReady ? (
              <span className="flex items-center gap-1.5 text-xs text-amber-500 font-medium">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                {t('unsaved')}
              </span>
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={saving}
              className="hidden sm:flex"
            >
              {t('cancel')}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={saving || !isReady || duration <= 0}
              className="gap-2 shadow-sm"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ TWO-PANEL LAYOUT ═══ */}
      <div className="flex-1 overflow-hidden flex">
        {/* LEFT SIDEBAR — Lesson Settings */}
        <aside className="w-72 lg:w-80 shrink-0 bg-background border-r flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Title (mobile) */}
            <div className="md:hidden space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('lessonTitleLabel')}
              </Label>
              <Input
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('lessonTitlePlaceholder')}
              />
            </div>

            {/* Lesson Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('contentType')}
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                {lessonTypes.map((lt) => {
                  const meta = LESSON_TYPE_META[lt];
                  const Icon = meta.icon;
                  const isSelected = type === lt;
                  return (
                    <button
                      key={lt}
                      type="button"
                      onClick={() => setType(lt)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : meta.color}`}
                      />
                      <span className="truncate text-xs">
                        {t(meta.labelKey as Parameters<typeof t>[0])}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('durationMinutes')}
                </Label>
                {type === 'text' && (
                  <span className="text-[10px] text-muted-foreground italic">
                    {t('textDurationHint')}
                  </span>
                )}
                {type === 'video' && (
                  <span className="text-[10px] text-muted-foreground italic">
                    {t('videoDurationHint')}
                  </span>
                )}
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="pl-9"
                  disabled={type === 'text'}
                />
              </div>
              {duration <= 0 && (
                <p className="text-[10px] text-destructive">{t('durationPositiveError')}</p>
              )}
            </div>

            {/* Unit Assignment */}
            {units.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('unit')}
                </Label>
                <select
                  value={unitId ?? ''}
                  onChange={(e) => setUnitId(e.target.value || null)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">{t('ungroupedLessons')}</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Readiness Summary */}
            <div
              className={`rounded-xl border p-3 ${isReady ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-900' : 'border-dashed border-muted bg-muted/20'}`}
            >
              <div className="flex items-start gap-2.5">
                {isReady ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div>
                  <p
                    className={`text-xs font-medium ${isReady ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}
                  >
                    {isReady ? t('lessonReadyToSave') : t('lessonNeedsContent')}
                  </p>
                  {!title.trim() && (
                    <p className="text-xs text-muted-foreground mt-1">{t('lessonMissingTitle')}</p>
                  )}
                  {!isReady && title.trim() && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('lessonNeedsMoreContent')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom action on mobile */}
          <div className="sm:hidden shrink-0 border-t p-4 flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={saving || !isReady || duration <= 0}
              className="flex-1 gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t('save')}
            </Button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto">
          {/* Content type badge + title */}
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b px-6 py-3 flex items-center gap-3">
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${typeMeta.color} border-current/20 bg-current/5`}
            >
              <TypeIcon className="h-3.5 w-3.5" />
              {t(typeMeta.labelKey as Parameters<typeof t>[0])}
            </span>
            {title ? (
              <span className="text-sm font-medium text-foreground truncate">{title}</span>
            ) : (
              <span className="text-sm text-muted-foreground italic">{t('noTitleYet')}</span>
            )}
          </div>

          <div className="p-6 lg:p-8 max-w-4xl">
            {/* Title field in main area if desktop */}
            <div className="hidden md:block mb-6 space-y-1.5">
              <Label className="text-sm font-medium">{t('lessonTitleLabel')}</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('lessonTitlePlaceholder')}
                className="text-base font-medium h-11"
                autoFocus={!isEditing}
              />
            </div>

            {/* Content area by lesson type */}
            <div className="space-y-4">
              <LessonTypeFields
                type={type}
                content={content}
                onContentChange={setContent}
                videoUrl={videoUrl}
                onVideoUrlChange={setVideoUrl}
                aiPrompt={aiPrompt}
                onAiPromptChange={setAiPrompt}
                microCards={microCards}
                onMicroCardsChange={setMicroCards}
                practiceExerciseSetId={practiceExerciseSetId}
                onPracticeExerciseSetIdChange={setPracticeExerciseSetId}
                practiceExerciseSets={attachablePracticeExerciseSets}
                examId={examId}
                onExamIdChange={setExamId}
                exams={attachableExams}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
