'use client';

import { useTranslations } from 'next-intl';
import { Input, Label } from '@/components/ui';
import { LessonType } from '@/lib/course-api';

export interface MicroCardDraft {
  front: string;
  pinyin: string;
  back: string;
  example: string;
  audioUrl: string;
}

interface LessonTypeFieldsProps {
  type: LessonType;
  content: string;
  onContentChange: (value: string) => void;
  videoUrl: string;
  onVideoUrlChange: (value: string) => void;
  aiPrompt: string;
  onAiPromptChange: (value: string) => void;
  microCard: MicroCardDraft;
  onMicroCardChange: (value: MicroCardDraft) => void;
}

export function LessonTypeFields({
  type,
  content,
  onContentChange,
  videoUrl,
  onVideoUrlChange,
  aiPrompt,
  onAiPromptChange,
  microCard,
  onMicroCardChange,
}: LessonTypeFieldsProps) {
  const t = useTranslations('Admin');

  const updateMicroCard = (field: keyof MicroCardDraft, value: string) => {
    onMicroCardChange({ ...microCard, [field]: value });
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
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          placeholder={t('lessonContentPlaceholder')}
          className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
      </div>
    );
  }

  if (type === 'micro_card') {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{t('microCardFront')}</Label>
            <Input
              value={microCard.front}
              onChange={(event) => updateMicroCard('front', event.target.value)}
              placeholder={t('microCardFrontPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">{t('microCardPinyin')}</Label>
            <Input
              value={microCard.pinyin}
              onChange={(event) => updateMicroCard('pinyin', event.target.value)}
              placeholder={t('microCardPinyinPlaceholder')}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('microCardBack')}</Label>
          <Input
            value={microCard.back}
            onChange={(event) => updateMicroCard('back', event.target.value)}
            placeholder={t('microCardBackPlaceholder')}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('microCardExample')}</Label>
          <textarea
            value={microCard.example}
            onChange={(event) => updateMicroCard('example', event.target.value)}
            placeholder={t('microCardExamplePlaceholder')}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('microCardAudioUrl')}</Label>
          <Input
            value={microCard.audioUrl}
            onChange={(event) => updateMicroCard('audioUrl', event.target.value)}
            placeholder={t('microCardAudioUrlPlaceholder')}
          />
        </div>
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
    pinyin: '',
    back: '',
    example: '',
    audioUrl: '',
  };
}

export function parseMicroCardContent(content: string | null | undefined): MicroCardDraft {
  if (!content) {
    return createEmptyMicroCardDraft();
  }

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    return {
      front: readString(parsed.front),
      pinyin: readString(parsed.pinyin),
      back: readString(parsed.back),
      example: readString(parsed.example),
      audioUrl: readString(parsed.audioUrl),
    };
  } catch {
    return createEmptyMicroCardDraft();
  }
}

export function serializeMicroCardContent(input: MicroCardDraft) {
  const card = {
    front: input.front.trim(),
    back: input.back.trim(),
    ...(input.pinyin.trim() ? { pinyin: input.pinyin.trim() } : {}),
    ...(input.example.trim() ? { example: input.example.trim() } : {}),
    ...(input.audioUrl.trim() ? { audioUrl: input.audioUrl.trim() } : {}),
  };

  return JSON.stringify(card);
}

export function isLessonDraftReady(input: {
  type: LessonType;
  title: string;
  content: string;
  videoUrl: string;
  aiPrompt: string;
  microCard: MicroCardDraft;
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
    return input.microCard.front.trim().length > 0 && input.microCard.back.trim().length > 0;
  }

  return true;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}
