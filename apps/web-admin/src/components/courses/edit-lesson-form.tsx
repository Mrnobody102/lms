'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Lesson } from '@/lib/course-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface EditLessonDialogProps {
  lesson: Lesson | null;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
}

export function EditLessonDialog({
  lesson,
  onSubmit,
  open,
  onOpenChange,
  saving,
}: EditLessonDialogProps) {
  const t = useTranslations('Admin');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'text' | 'quiz'>('video');
  const [duration, setDuration] = useState(10);

  useEffect(() => {
    if (lesson) {
      setTitle(lesson.title);
      setType(lesson.type as 'video' | 'text' | 'quiz');
      setDuration(lesson.duration);
    }
  }, [lesson]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await onSubmit({ title, type, duration });
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

          <div className="space-y-1.5">
            <Label className="text-sm">{t('contentType')}</Label>
            <div className="flex gap-2">
              {(['video', 'text', 'quiz'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium capitalize transition-all ${
                    type === t
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background hover:bg-muted'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

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
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
