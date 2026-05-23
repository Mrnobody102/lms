'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '@repo/ui';
import { useCohorts, Cohort } from '@/hooks/use-cohorts';

interface CohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  cohort: Cohort | null;
}

export function CohortModal({ isOpen, onClose, cohort }: CohortModalProps) {
  const t = useTranslations('Admin');
  const { createCohort, updateCohort } = useCohorts();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cohort) {
      setName(cohort.name);
      setDescription(cohort.description || '');
      setIsActive(cohort.isActive);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError('');
  }, [cohort, isOpen]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('common.required'));
      return;
    }

    try {
      if (cohort) {
        await updateCohort.mutateAsync({
          id: cohort.id,
          name,
          description,
          isActive,
        });
      } else {
        await createCohort.mutateAsync({
          name,
          description,
          isActive,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save cohort:', err);
    }
  };

  const isPending = createCohort.isPending || updateCohort.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border">
        <DialogHeader className="p-6 border-b border-border">
          <DialogTitle className="text-xl font-semibold">
            {cohort ? t('cohorts.editTitle') : t('cohorts.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('cohorts.nameLabel')}</Label>
            <Input
              id="name"
              placeholder={t('cohorts.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('cohorts.descLabel')}</Label>
            <textarea
              id="description"
              placeholder={t('cohorts.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              {t('common.active')}
            </Label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {cohort ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
