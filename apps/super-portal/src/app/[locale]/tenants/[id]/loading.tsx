'use client';

import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Loading() {
  const t = useTranslations('SuperPortal.tenantDetails');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
      <p className="text-muted-foreground font-medium">{t('loading')}</p>
    </div>
  );
}
