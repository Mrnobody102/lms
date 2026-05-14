'use client';

import { useTranslations } from 'next-intl';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminResetPasswordPage() {
  const t = useTranslations('Admin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/25">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {t('auth.resetPasswordTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.resetPasswordDesc')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <Suspense
            fallback={
              <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
