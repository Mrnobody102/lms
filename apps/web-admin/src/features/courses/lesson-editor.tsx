'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson, LessonType } from '@/lib/course-api';
import { useExams } from '@/hooks/use-exams';
import { usePracticeExerciseSets } from '@/hooks/use-practice';
import { Button, Input, Label } from '@/components/ui';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import {
  isLessonDraftReady,
  parseMicroCardContent,
  serializeMicroCardContent,
  createEmptyMicroCardDraft,
  LessonTypeFields,
} from './lesson-type-fields';

interface LessonEditorProps {
  courseId: string;
  lesson?: Lesson | null;
  units?: CourseUnit[];
  initialUnitId?: string | null;
  nextOrder?: number;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}

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

  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonType>('video');
  const [duration, setDuration] = useState(10);
  const [unitId, setUnitId] = useState<string | null>(initialUnitId ?? units[0]?.id ?? null);
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [microCards, setMicroCards] = useState([createEmptyMicroCardDraft()]);
  const [practiceExerciseSetId, setPracticeExerciseSetId] = useState('');
  const [examId, setExamId] = useState('');

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
    }
  }, [lesson]);

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
            ? serializeMicroCardContent(microCards)
            : null,
      practiceExerciseSetId: type === 'practice' ? practiceExerciseSetId : null,
      examId: type === 'exam' ? examId : null,
      videoUrl: type === 'video' ? videoUrl.trim() : null,
      aiPrompt: type === 'simulation' ? aiPrompt.trim() : null,
    };

    if (!isEditing && nextOrder !== undefined) {
      payload.order = nextOrder;
    }

    await onSubmit(payload);
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

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={saving}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? t('editLessonTitle') : t('addLessonTitle')}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !isReady}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('lessonTitleLabel')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('lessonTitlePlaceholder')}
              autoFocus={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('durationMinutes')}</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            />
          </div>

          {units.length > 0 && (
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">{t('unit')}</Label>
              <select
                value={unitId ?? ''}
                onChange={(event) => setUnitId(event.target.value || null)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('contentType')}</Label>
          <div className="flex flex-wrap gap-2">
            {lessonTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                  type === option.value
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-input bg-background hover:bg-muted'
                }`}
              >
                {t(option.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-dashed">
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
    </div>
  );
}

const lessonTypeOptions = [
  { value: 'video', labelKey: 'lessonTypeVideo' },
  { value: 'text', labelKey: 'lessonTypeText' },
  { value: 'practice', labelKey: 'lessonTypePractice' },
  { value: 'exam', labelKey: 'lessonTypeExam' },
  { value: 'simulation', labelKey: 'lessonTypeSimulation' },
  { value: 'micro_card', labelKey: 'lessonTypeMicroCard' },
] as const satisfies ReadonlyArray<{
  value: LessonType;
  labelKey:
    | 'lessonTypeVideo'
    | 'lessonTypeText'
    | 'lessonTypePractice'
    | 'lessonTypeExam'
    | 'lessonTypeSimulation'
    | 'lessonTypeMicroCard';
}>;
