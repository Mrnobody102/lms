'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('Sales');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h1 className="text-lg font-semibold">{t('common.errorTitle')}</h1>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted"
      >
        {t('common.retry')}
      </button>
    </div>
  );
}
