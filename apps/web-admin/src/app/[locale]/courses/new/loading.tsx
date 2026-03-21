'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('Admin');

  return (
    <div className="min-h-screen font-sans flex bg-background/50">
      <div className="md:ml-64 flex-1 p-6 md:p-10 lg:p-16">
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="font-black text-sm uppercase tracking-widest opacity-50">{t('loading')}</p>
        </div>
      </div>
    </div>
  );
}
