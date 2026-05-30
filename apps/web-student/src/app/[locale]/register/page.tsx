import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../navigation';
import { RegisterPageClient } from './register-page-client';

export default async function RegisterPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Student' });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Brand — server-rendered */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-6 shadow-lg shadow-primary/25">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.registerDesc')}</p>
        </div>

        {/* Register Card — only the form is client */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl dark:shadow-black/50">
          <Suspense fallback={null}>
            <RegisterPageClient />
          </Suspense>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.footerRegister')}{' '}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            {t('auth.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
