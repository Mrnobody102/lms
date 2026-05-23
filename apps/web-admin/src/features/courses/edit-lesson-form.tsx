'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson, LessonType } from '@/lib/course-api';
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
  createEmptyQuizDraft,
  LessonTypeFields,
  createEmptyMicroCardDraft,
  isLessonDraftReady,
  parseMicroCardContent,
  parseQuizContent,
  serializeMicroCardContent,
  serializeQuizContent,
} from './lesson-type-fields';

interface EditLessonDialogProps {
  lesson: Lesson | null;
  units?: CourseUnit[];
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
}

export function EditLessonDialog({
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
  const [microCard, setMicroCard] = useState(createEmptyMicroCardDraft());
  const [quiz, setQuiz] = useState(createEmptyQuizDraft());

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
      setMicroCard(parseMicroCardContent(lesson.content));
      setQuiz(parseQuizContent(lesson.quiz));
    }
  }, [lesson, open]);

  const handleSubmit = async () => {
    if (!isLessonDraftReady({ type, title, content, videoUrl, aiPrompt, microCard, quiz })) return;

    await onSubmit({
      title,
      type,
      duration,
      unitId,
      content:
        type === 'text'
          ? content.trim()
          : type === 'micro_card'
            ? serializeMicroCardContent(microCard)
            : null,
      quiz: type === 'quiz' ? serializeQuizContent(quiz) : null,
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
            microCard={microCard}
            onMicroCardChange={setMicroCard}
            quiz={quiz}
            onQuizChange={setQuiz}
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
              !isLessonDraftReady({ type, title, content, videoUrl, aiPrompt, microCard, quiz })
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
  { value: 'quiz', labelKey: 'lessonTypeQuiz' },
  { value: 'simulation', labelKey: 'lessonTypeSimulation' },
  { value: 'micro_card', labelKey: 'lessonTypeMicroCard' },
] as const satisfies ReadonlyArray<{
  value: LessonType;
  labelKey:
    | 'lessonTypeVideo'
    | 'lessonTypeText'
    | 'lessonTypeQuiz'
    | 'lessonTypeSimulation'
    | 'lessonTypeMicroCard';
}>;
