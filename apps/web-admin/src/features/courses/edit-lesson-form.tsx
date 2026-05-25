'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson, LessonType } from '@/lib/course-api';
import { useExams } from '@/hooks/use-exams';
import { usePracticeExerciseSets } from '@/hooks/use-practice';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui';
import { Loader2 } from 'lucide-react';
import {
  isLessonDraftReady,
  parseMicroCardContent,
  serializeMicroCardContent,
  createEmptyMicroCardDraft,
  LessonTypeFields,
} from './lesson-type-fields';

interface EditLessonDialogProps {
  courseId: string;
  lesson: Lesson | null;
  units?: CourseUnit[];
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
}

export function EditLessonDialog({
  courseId,
  lesson,
  units = [],
  onSubmit,
  open,
  onOpenChange,
  saving,
}: EditLessonDialogProps) {
  const t = useTranslations('Admin');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<LessonType>('video');
  const [duration, setDuration] = useState(10);
  const [unitId, setUnitId] = useState<string | null>(null);
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
    if (!open) return;
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
  }, [lesson, open]);

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

    await onSubmit({
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
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editLessonTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{t('lessonTitleLabel')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('lessonTitlePlaceholder')}
            />
          </div>

          {units.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-sm">{t('unit')}</Label>
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

          <div className="space-y-1.5">
            <Label className="text-sm">{t('contentType')}</Label>
            <div className="grid grid-cols-2 gap-2">
              {lessonTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    type === option.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-muted'
                  }`}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>
          </div>

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

          <div className="space-y-1.5">
            <Label className="text-sm">{t('durationMinutes')}</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="w-32"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              saving ||
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
            }
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
