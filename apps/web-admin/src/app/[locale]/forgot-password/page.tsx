'use client';

import { useTranslations } from 'next-intl';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { Link } from '@/navigation';

export default function AdminForgotPasswordPage() {
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
            {t('auth.forgotPasswordTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.forgotPasswordDesc')}</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
          <ForgotPasswordForm />
        </div>

        {/* Back Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-500 font-semibold transition-colors"
          >
            {t('auth.backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
