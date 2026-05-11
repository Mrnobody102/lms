'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('Student');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-background font-sans">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
        {t('exam.loading')}
      </p>
    </div>
  );
}
