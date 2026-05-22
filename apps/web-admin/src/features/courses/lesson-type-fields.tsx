'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/ui';
import { LessonType } from '@/lib/course-api';
import { RichTextEditor } from '@/components/authoring/rich-text-editor';

export interface MicroCardDraft {
  front: string;
  pinyin: string;
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
  microCard: MicroCardDraft;
  onMicroCardChange: (value: MicroCardDraft) => void;
  quiz: QuizDraft;
  onQuizChange: (value: QuizDraft) => void;
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
  quiz,
  onQuizChange,
}: LessonTypeFieldsProps) {
  const t = useTranslations('Admin');

  const updateMicroCard = (field: keyof MicroCardDraft, value: string) => {
    onMicroCardChange({ ...microCard, [field]: value });
  };

  const updateQuizQuestion = (index: number, patch: Partial<QuizQuestionDraft>) => {
    onQuizChange({
      questions: quiz.questions.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...patch } : question,
      ),
    });
  };

  const addQuizQuestion = () => {
    onQuizChange({
      questions: [
        ...quiz.questions,
        {
          question: '',
          options: ['', ''],
          correctAnswer: 0,
        },
      ],
    });
  };

  const removeQuizQuestion = (index: number) => {
    onQuizChange({
      questions: quiz.questions.filter((_question, currentIndex) => currentIndex !== index),
    });
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

  if (type === 'quiz') {
    return (
      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t('quizQuestions')}</p>
            <p className="text-xs text-muted-foreground">{t('quizQuestionsDesc')}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addQuizQuestion}>
            {t('quizAddQuestion')}
          </Button>
        </div>

        <div className="space-y-3">
          {quiz.questions.map((question, index) => (
            <div key={index} className="space-y-3 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {t('quizQuestionLabel', { index: index + 1 })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeQuizQuestion(index)}
                  disabled={quiz.questions.length === 1}
                >
                  {t('remove')}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('questionPrompt')}</Label>
                <textarea
                  value={question.question}
                  onChange={(event) => updateQuizQuestion(index, { question: event.target.value })}
                  placeholder={t('questionPromptPlaceholder')}
                  className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">{t('answerOptions')}</Label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(event) => {
                        const options = [...question.options];
                        options[optionIndex] = event.target.value;
                        updateQuizQuestion(index, { options });
                      }}
                      placeholder={t('quizOptionPlaceholder', { index: optionIndex + 1 })}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const options = question.options.filter(
                          (_value, currentIndex) => currentIndex !== optionIndex,
                        );
                        updateQuizQuestion(index, {
                          options: options.length >= 2 ? options : ['', ''],
                          correctAnswer: Math.min(
                            question.correctAnswer,
                            Math.max(options.length - 1, 0),
                          ),
                        });
                      }}
                      className="rounded-md border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                      disabled={question.options.length <= 2}
                    >
                      {t('remove')}
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuizQuestion(index, { options: [...question.options, ''] })}
                >
                  {t('quizAddOption')}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">{t('correctAnswer')}</Label>
                <Input
                  type="number"
                  min={0}
                  max={Math.max(question.options.length - 1, 0)}
                  value={question.correctAnswer}
                  onChange={(event) =>
                    updateQuizQuestion(index, {
                      correctAnswer: Number(event.target.value) || 0,
                    })
                  }
                  placeholder={t('correctAnswerIndexPlaceholder')}
                  className="w-32"
                />
              </div>
            </div>
          ))}
        </div>
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

export function createEmptyQuizDraft(): QuizDraft {
  return {
    questions: [
      {
        question: '',
        options: ['', ''],
        correctAnswer: 0,
      },
    ],
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

export function parseQuizContent(content: unknown): QuizDraft {
  if (!content || typeof content !== 'object') {
    return createEmptyQuizDraft();
  }

  const record = content as Record<string, unknown>;
  const questions = Array.isArray(record.questions)
    ? record.questions
        .map((question) => normalizeQuizQuestion(question))
        .filter((question): question is QuizQuestionDraft => question !== null)
    : [];

  return {
    questions: questions.length > 0 ? questions : createEmptyQuizDraft().questions,
  };
}

export function serializeQuizContent(input: QuizDraft) {
  return {
    questions: input.questions
      .map((question) => ({
        question: question.question.trim(),
        options: question.options.map((option) => option.trim()).filter(Boolean),
        correctAnswer: Number.isFinite(question.correctAnswer) ? question.correctAnswer : 0,
      }))
      .filter((question) => question.question && question.options.length >= 2),
  };
}

export function isLessonDraftReady(input: {
  type: LessonType;
  title: string;
  content: string;
  videoUrl: string;
  aiPrompt: string;
  microCard: MicroCardDraft;
  quiz: QuizDraft;
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

  if (input.type === 'quiz') {
    return (
      input.quiz.questions.length > 0 &&
      input.quiz.questions.every(
        (question) =>
          question.question.trim().length > 0 &&
          question.options.filter((option) => option.trim().length > 0).length >= 2,
      )
    );
  }

  return true;
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeQuizQuestion(value: unknown): QuizQuestionDraft | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const options = Array.isArray(record.options)
    ? record.options.map((option) => readString(option)).filter(Boolean)
    : [];
  if (options.length < 2) {
    return null;
  }

  const correctAnswer = Number(record.correctAnswer);
  return {
    question: readString(record.question),
    options,
    correctAnswer: Number.isFinite(correctAnswer) ? correctAnswer : 0,
  };
}
