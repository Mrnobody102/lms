'use client';

import { useTranslations } from 'next-intl';
import {
  parseMicroCardContent as parseSharedMicroCardContent,
  serializeMicroCardContent as serializeSharedMicroCardContent,
  type MicroCardItem,
} from '@repo/shared';
import { Button, Input, Label } from '@/components/ui';
import { LessonType } from '@/lib/course-api';
import { RichTextEditor } from '@/components/authoring/rich-text-editor';

export interface MicroCardDraft {
  front: string;
  phonetics: string;
  back: string;
  example: string;
  audioUrl: string;
}

export interface QuizQuestionDraft {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface QuizDraft {
  questions: QuizQuestionDraft[];
}

interface LessonTypeFieldsProps {
  type: LessonType;
  content: string;
  onContentChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  microCards: MicroCardDraft[];
  onMicroCardsChange: (value: MicroCardDraft[]) => void;
  practiceExerciseSetId: string;
  onPracticeExerciseSetIdChange: (value: string) => void;
  practiceExerciseSets?: ResourceOption[];
  examId: string;
  onExamIdChange: (value: string) => void;
  exams?: ResourceOption[];
}

interface ResourceOption {
  id: string;
  title: string;
}

export function LessonTypeFields({
  type,
  content,
  onContentChange,
  videoUrl,
  onVideoUrlChange,
  aiPrompt,
  onAiPromptChange,
  microCards,
  onMicroCardsChange,
  practiceExerciseSetId,
  onPracticeExerciseSetIdChange,
  practiceExerciseSets = [],
  examId,
  onExamIdChange,
  exams = [],
}: LessonTypeFieldsProps) {
  const t = useTranslations('Admin');

  const updateMicroCard = (index: number, field: keyof MicroCardDraft, value: string) => {
    onMicroCardsChange(
      microCards.map((card, currentIndex) =>
        currentIndex === index ? { ...card, [field]: value } : card,
      ),
    );
  };

  const addMicroCard = () => {
    onMicroCardsChange([...microCards, createEmptyMicroCardDraft()]);
  };

  const removeMicroCard = (index: number) => {
    const nextCards = microCards.filter((_card, currentIndex) => currentIndex !== index);
    onMicroCardsChange(nextCards.length > 0 ? nextCards : [createEmptyMicroCardDraft()]);
  };

  if (type === 'video') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t('videoUrl')}</Label>
        <Input
          value={videoUrl}
          onChange={(event) => onVideoUrlChange(event.target.value)}
          placeholder={t('videoUrlPlaceholder')}
        />
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t('lessonContent')}</Label>
        <RichTextEditor
          value={content}
          onChange={onContentChange}
          placeholder={t('lessonContentPlaceholder')}
          minHeight="14rem"
        />
      </div>
    );
  }

  if (type === 'practice') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t('practiceExerciseSet')}</Label>
        <select
          value={practiceExerciseSetId}
          onChange={(event) => onPracticeExerciseSetIdChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('practiceExerciseSetPlaceholder')}</option>
          {practiceExerciseSets.map((set) => (
            <option key={set.id} value={set.id}>
              {set.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t('practiceExerciseSetHelp')}</p>
      </div>
    );
  }

  if (type === 'exam') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t('exam')}</Label>
        <select
          value={examId}
          onChange={(event) => onExamIdChange(event.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">{t('examPlaceholder')}</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.title}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">{t('examHelp')}</p>
      </div>
    );
  }

  if (type === 'micro_card') {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t('microCardDeck')}</p>
            <p className="text-xs text-muted-foreground">{t('microCardDeckDesc')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addMicroCard}>
            {t('microCardAdd')}
          </Button>
        </div>

        {microCards.map((microCard, index) => (
          <div key={index} className="space-y-3 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{t('microCardLabel', { index: index + 1 })}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMicroCard(index)}
                disabled={microCards.length === 1}
              >
                {t('remove')}
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">{t('microCardFront')}</Label>
                <Input
                  value={microCard.front}
                  onChange={(event) => updateMicroCard(index, 'front', event.target.value)}
                  placeholder={t('microCardFrontPlaceholder')}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">{t('microCardPhonetics')}</Label>
                <Input
                  value={microCard.phonetics}
                  onChange={(event) => updateMicroCard(index, 'phonetics', event.target.value)}
                  placeholder={t('microCardPhoneticsPlaceholder')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('microCardBack')}</Label>
              <Input
                value={microCard.back}
                onChange={(event) => updateMicroCard(index, 'back', event.target.value)}
                placeholder={t('microCardBackPlaceholder')}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('microCardExample')}</Label>
              <textarea
                value={microCard.example}
                onChange={(event) => updateMicroCard(index, 'example', event.target.value)}
                placeholder={t('microCardExamplePlaceholder')}
                className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('microCardAudioUrl')}</Label>
              <Input
                value={microCard.audioUrl}
                onChange={(event) => updateMicroCard(index, 'audioUrl', event.target.value)}
                placeholder={t('microCardAudioUrlPlaceholder')}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'simulation') {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm">{t('aiPrompt')}</Label>
        <textarea
          value={aiPrompt}
          onChange={(event) => onAiPromptChange(event.target.value)}
          placeholder={t('lessonAiPromptPlaceholder')}
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
      </div>
    );
  }

  return null;
}

export function createEmptyMicroCardDraft(): MicroCardDraft {
  return {
    front: '',
    phonetics: '',
    back: '',
    example: '',
    audioUrl: '',
  };
}

export function isLessonDraftReady(input: {
  type: LessonType;
  title: string;
  content: string;
  videoUrl: string;
  aiPrompt: string;
  practiceExerciseSetId: string;
  examId: string;
  microCards: MicroCardDraft[];
}) {
  if (!input.title.trim()) {
    return false;
  }

  if (input.type === 'video') {
    return input.videoUrl.trim().length > 0;
  }

  if (input.type === 'text') {
    return input.content.trim().length > 0;
  }

  if (input.type === 'simulation') {
    return input.aiPrompt.trim().length > 0;
  }

  if (input.type === 'micro_card') {
    return input.microCards.some(
      (card) => card.front.trim().length > 0 && card.back.trim().length > 0,
    );
  }

  if (input.type === 'practice') {
    return input.practiceExerciseSetId.trim().length > 0;
  }

  if (input.type === 'exam') {
    return input.examId.trim().length > 0;
  }

  return true;
}

export function parseMicroCardContent(content: string | null | undefined): MicroCardDraft[] {
  if (!content) {
    return [createEmptyMicroCardDraft()];
  }

  const cards = parseSharedMicroCardContent(content).content.cards.map(toMicroCardDraft);
  return cards.length > 0 ? cards : [createEmptyMicroCardDraft()];
}

export function serializeMicroCardContent(input: MicroCardDraft[]) {
  return serializeSharedMicroCardContent(input);
}

function toMicroCardDraft(value: MicroCardItem): MicroCardDraft {
  return {
    front: value.front,
    phonetics: value.phonetics ?? '',
    back: value.back,
    example: value.example ?? '',
    audioUrl: value.audioUrl ?? '',
  };
}
