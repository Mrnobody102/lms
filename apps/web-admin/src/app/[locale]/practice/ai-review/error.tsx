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
  const t = useTranslations('Admin');

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center font-sans">
      <div className="flex h-14 w-14 items-center justify-center rounded-md border border-destructive/20 bg-destructive/5 text-destructive">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="text-lg font-semibold">{t('aiReviewJobLoadError')}</h1>
      <button
        type="button"
        onClick={reset}
        className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-semibold hover:bg-muted"
      >
        {t('retry')}
      </button>
    </div>
  );
}
