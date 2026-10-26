'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import { adaptiveApi } from '@/lib/adaptive-api';
import { getApiErrorMessage } from '@/lib/api-error';
import { Link, useRouter } from '@/navigation';

export default function AdaptivePracticePage() {
  const t = useTranslations('Student.adaptive');
  const { pathItemId } = useParams<{ pathItemId: string }>();
  const { isInitialized, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated) return;
    let cancelled = false;
    setError(null);
    void adaptiveApi
      .startPractice(pathItemId)
      .then(({ exerciseSetId }) => {
        if (cancelled) return;
        void queryClient.invalidateQueries({ queryKey: ['adaptive-next-steps'] });
        router.replace(`/practice/${exerciseSetId}`);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(reason, t('startError')));
      });
    return () => {
      cancelled = true;
    };
  }, [isInitialized, isAuthenticated, pathItemId, queryClient, retry, router, t]);

  return (
    <div className="min-h-screen bg-background">
      <StudentNav showLinks />
      <main className="mx-auto max-w-3xl px-4 py-8">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo={`/practice/adaptive/${pathItemId}`} />
        ) : error ? (
          <section role="alert" className="space-y-4 rounded-md border p-5">
            <p className="text-destructive">{error}</p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="underline"
              >
                {t('retry')}
              </button>
              <Link href="/">{t('backToDashboard')}</Link>
            </div>
          </section>
        ) : (
          <div role="status" className="flex items-center gap-3 rounded-md border p-5">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('starting')}
          </div>
        )}
      </main>
    </div>
  );
}
