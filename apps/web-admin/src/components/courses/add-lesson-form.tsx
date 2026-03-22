'use client';

import { useState } from 'react';
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
import { Loader2, Plus } from 'lucide-react';

interface AddLessonDialogProps {
  existingLessonsCount: number;
  onSubmit: (data: Partial<Lesson>) => Promise<boolean>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
}

export function AddLessonDialog({
  existingLessonsCount,
  onSubmit,
  open,
  onOpenChange,
  saving,
}: AddLessonDialogProps) {
  const t = useTranslations('Admin');

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'video' | 'text' | 'quiz'>('video');
  const [duration, setDuration] = useState(10);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const success = await onSubmit({
      title,
      type,
      duration,
      order: existingLessonsCount + 1,
    });
    if (success) {
      setTitle('');
      setType('video');
      setDuration(10);
      onOpenChange(false);
    }
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !saving) {
      setTitle('');
      setType('video');
      setDuration(10);
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addLessonTitle')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">{t('lessonTitleLabel')}</Label>
            <Input
              placeholder={t('lessonTitlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
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
          <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('add')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
