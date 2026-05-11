'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('Student');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
          {t('exam.loadingAttempt')}
        </p>
      </div>
    </div>
  );
}
