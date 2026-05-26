'use client';

import { useState } from 'react';
import { KeyRound, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '../../../components/layout/student-nav';
import { useAuthStore } from '../../../features/auth/auth.store';
import { Link } from '../../../navigation';
import api from '@/lib/api';

export default function ActivationPage() {
  const t = useTranslations('Student.activation');
  const { isAuthenticated, isInitialized } = useAuthStore();

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/activation/redeem', { code });
      setSuccess(true);
      setCode('');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const message =
        axiosError.response?.data?.message || axiosError.message || t('errorRedeeming');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const authT = useTranslations('Student.auth');

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto flex max-w-lg items-center justify-center px-6 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-lg px-6 py-24">
          <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-4 text-muted-foreground">{t('loginRequired')}</p>
            <Link
              href="/login?next=/activation"
              className="mt-8 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              {authT('loginButton')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-lg px-6 py-24">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 text-emerald-500">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="mb-2 text-lg font-semibold">{t('successTitle')}</h2>
              <p className="mb-6 text-sm text-muted-foreground">{t('successMessage')}</p>
              <Link
                href="/courses"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90"
              >
                {t('goToCourses')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium">
                  {t('inputLabel')}
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABCD-1234-WXYZ"
                  className="flex h-12 w-full rounded-md border bg-background px-3 py-2 text-center text-lg tracking-widest outline-none transition-colors focus:border-primary disabled:opacity-50"
                  disabled={isLoading}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !code.trim()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('submitButton')}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
