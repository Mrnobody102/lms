'use client';

import React from 'react';
import { Button, Input, Label } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

type TranslationValue = string | number | Date;

interface QuestionOptionsEditorProps {
  type: string;
  optionsText: string;
  correctAnswer: string;
  onChange: (updates: { optionsText?: string; correctAnswer?: string }) => void;
  t: (key: string, values?: Record<string, TranslationValue>) => string;
}

export function QuestionOptionsEditor({
  type,
  optionsText,
  correctAnswer,
  onChange,
  t,
}: QuestionOptionsEditorProps) {
  if (type === 'MULTIPLE_CHOICE') {
    const options = optionsText ? optionsText.split('\n') : ['', ''];

    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Label>{t('answerOptions')}</Label>
        <p className="text-xs text-muted-foreground mb-3">{t('multipleChoiceOptionsHelp')}</p>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-3">
            <input
              type="radio"
              name="correctAnswer"
              className="h-4 w-4 cursor-pointer text-primary focus:ring-primary"
              checked={correctAnswer === String(i)}
              onChange={() => onChange({ correctAnswer: String(i) })}
            />
            <Input
              value={opt}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newOptions = [...options];
                newOptions[i] = e.target.value;
                onChange({ optionsText: newOptions.join('\n') });
              }}
              placeholder={t('optionPlaceholder', { number: i + 1 })}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newOptions = options.filter((_, idx) => idx !== i);
                onChange({ optionsText: newOptions.join('\n') });
                if (correctAnswer === String(i)) {
                  onChange({ correctAnswer: '' });
                } else if (Number(correctAnswer) > i) {
                  onChange({ correctAnswer: String(Number(correctAnswer) - 1) });
                }
              }}
              disabled={options.length <= 2}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            onChange({ optionsText: [...options, ''].join('\n') });
          }}
          className="mt-2 gap-2"
        >
          <Plus className="h-4 w-4" /> {t('addOption')}
        </Button>
      </div>
    );
  }

  if (type === 'MATCHING') {
    let left: string[] = [];
    let right: string[] = [];
    try {
      const parsed = JSON.parse(optionsText);
      left = parsed.left || [];
      right = parsed.right || [];
    } catch {
      // ignore parse error for new/empty drafts
    }
    if (left.length === 0) {
      left = ['', ''];
      right = ['', ''];
    }

    const updateMatching = (l: string[], r: string[]) => {
      const newOptionsText = JSON.stringify({ left: l, right: r });
      const newCorrectAnswer: Record<string, string> = {};
      l.forEach((item, i) => {
        if (item.trim() && r[i].trim()) {
          newCorrectAnswer[item.trim()] = r[i].trim();
        }
      });
      onChange({
        optionsText: newOptionsText,
        correctAnswer: JSON.stringify(newCorrectAnswer),
      });
    };

    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Label>{t('matchingOptions')}</Label>
        <p className="text-xs text-muted-foreground mb-3">{t('matchingOptionsHelp')}</p>
        {left.map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Input
              value={left[i]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newL = [...left];
                newL[i] = e.target.value;
                updateMatching(newL, right);
              }}
              placeholder={t('matchingLeftPlaceholder')}
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={right[i]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newR = [...right];
                newR[i] = e.target.value;
                updateMatching(left, newR);
              }}
              placeholder={t('matchingRightPlaceholder')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newL = left.filter((_, idx) => idx !== i);
                const newR = right.filter((_, idx) => idx !== i);
                updateMatching(newL, newR);
              }}
              disabled={left.length <= 2}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            updateMatching([...left, ''], [...right, '']);
          }}
          className="mt-2 gap-2"
        >
          <Plus className="h-4 w-4" /> {t('addMatchingPair')}
        </Button>
      </div>
    );
  }

  if (type === 'ORDERING') {
    const items = optionsText ? optionsText.split('\n') : ['', ''];

    const updateOrdering = (newItems: string[]) => {
      onChange({
        optionsText: newItems.join('\n'),
        correctAnswer: JSON.stringify(newItems.filter((i) => i.trim())),
      });
    };

    return (
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Label>{t('orderingOptions')}</Label>
        <p className="text-xs text-muted-foreground mb-3">{t('orderingOptionsHelp')}</p>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-medium">
              {i + 1}
            </div>
            <Input
              value={item}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const newItems = [...items];
                newItems[i] = e.target.value;
                updateOrdering(newItems);
              }}
              placeholder={t('orderingItemPlaceholder')}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const newItems = items.filter((_, idx) => idx !== i);
                updateOrdering(newItems);
              }}
              disabled={items.length <= 2}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            updateOrdering([...items, '']);
          }}
          className="mt-2 gap-2"
        >
          <Plus className="h-4 w-4" /> {t('addOrderingItem')}
        </Button>
      </div>
    );
  }

  return null;
}
