'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@/components/ui';
import { Save, Loader2 } from 'lucide-react';

interface CourseFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  aiEnabled: boolean;
  onAiEnabledChange: (enabled: boolean) => void;
  aiPrompt: string;
  onAiPromptChange: (prompt: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function CourseForm({
  title,
  onTitleChange,
  aiEnabled,
  onAiEnabledChange,
  aiPrompt,
  onAiPromptChange,
  onSave,
  saving,
}: CourseFormProps) {
  const t = useTranslations('Admin');

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">{t('courseName')}</Label>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder={t('courseNamePlaceholder')}
          className="text-base font-medium"
        />
      </div>
      <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">{t('aiSettings')}</Label>
            <p className="text-xs text-muted-foreground">{t('aiSettingsDesc')}</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(event) => onAiEnabledChange(event.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20"
            />
            {t('aiEnabled')}
          </label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">{t('aiPrompt')}</Label>
          <textarea
            value={aiPrompt}
            onChange={(event) => onAiPromptChange(event.target.value)}
            placeholder={t('aiPromptPlaceholder')}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>
      <Button onClick={onSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('save')}
      </Button>
    </div>
  );
}
