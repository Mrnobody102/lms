'use client';

import { useTranslations } from 'next-intl';
import { Button, Input, Label, Separator } from '@/components/ui';
import { Save, Loader2 } from 'lucide-react';

interface CourseFormProps {
  title: string;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  saving: boolean;
}

export function CourseForm({ title, onTitleChange, onSave, saving }: CourseFormProps) {
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
      <Button onClick={onSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('save')}
      </Button>
    </div>
  );
}
