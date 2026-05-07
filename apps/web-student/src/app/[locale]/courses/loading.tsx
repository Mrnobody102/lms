'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('Student');

  return (
    <div className="min-h-screen font-sans bg-background flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="font-black text-xs uppercase tracking-[0.2em] opacity-50">
        {t('courses.loading')}
      </p>
    </div>
  );
}
