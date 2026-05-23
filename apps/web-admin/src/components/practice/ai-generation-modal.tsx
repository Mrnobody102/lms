'use client';

import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Input,
  Label,
} from '@/components/ui';
import { useGeneratePracticeQuestions } from '@/hooks/use-practice';
import { PracticeQuestionType } from '@/lib/practice-api';
import { Loader2, Sparkles } from 'lucide-react';

interface AiGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  courseId?: string;
  unitId?: string;
}

export function AiGenerationModal({
  open,
  onOpenChange,
  onGenerated,
  onError,
  onSuccess,
  courseId,
  unitId,
}: AiGenerationModalProps) {
  const t = useTranslations('Admin');
  const [topic, setTopic] = useState('');
  const [context, setContext] = useState('');
  const [count, setCount] = useState(3);
  const [questionType, setQuestionType] = useState<PracticeQuestionType>('MULTIPLE_CHOICE');
  const [skillTags, setSkillTags] = useState('');

  const generateMutation = useGeneratePracticeQuestions();

  const resetDraft = () => {
    setTopic('');
    setContext('');
    setCount(3);
    setQuestionType('MULTIPLE_CHOICE');
    setSkillTags('');
  };

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      onError(t('aiTopicRequired'));
      return;
    }

    if (!courseId) {
      onError('Course must be selected first');
      return;
    }

    generateMutation.mutate(
      {
        courseId,
        unitId,
        topic,
        context,
        count,
        questionType,
        skillTags: skillTags
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          onSuccess(t('aiGenerateSuccess'));
          onGenerated();
          onOpenChange(false);
          resetDraft();
        },
        onError: (error) => {
          onError(t('aiGenerateError'));
          console.error(error);
        },
      },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            {t('aiGenerateQuestions')}
          </AlertDialogTitle>
          <AlertDialogDescription>{t('aiGenerateDescription')}</AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleGenerate} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="topic">{t('aiTopic')}</Label>
            <Input
              id="topic"
              placeholder={t('aiTopicPlaceholder')}
              value={topic}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="context">{t('aiContext')}</Label>
            <textarea
              id="context"
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder={t('aiContextPlaceholder')}
              value={context}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContext(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>{t('aiQuestionType')}</Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={questionType}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setQuestionType(e.target.value as PracticeQuestionType)
                }
              >
                <option value="MULTIPLE_CHOICE">{t('multipleChoice')}</option>
                <option value="FILL_BLANK">{t('fillBlank')}</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>{t('aiQuestionCount')}</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={count}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCount(parseInt(e.target.value) || 1)
                }
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="skillTags">{t('aiSkillTags')}</Label>
            <Input
              id="skillTags"
              placeholder={t('aiSkillTagsPlaceholder')}
              value={skillTags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillTags(e.target.value)}
            />
          </div>

          <AlertDialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetDraft();
                onOpenChange(false);
              }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={generateMutation.isPending || !topic.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {generateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {t('generate')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
