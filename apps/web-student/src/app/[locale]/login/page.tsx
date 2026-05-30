import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../navigation';
import { LoginPageClient } from './login-page-client';

export default async function LoginPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Student' });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-6 lg:p-8">
      <div className="w-full max-w-[360px] sm:max-w-[400px]">
        {/* Logo / Brand — rendered on the server, instant HTML */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white mb-6 shadow-xl shadow-primary/20 ring-1 ring-primary/10">
            <svg
              className="w-7 h-7"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">{t('auth.loginDesc')}</p>
        </div>

        {/* Login Card — only the form is a client component */}
        <div className="rounded-2xl sm:rounded-3xl border border-border/50 bg-card p-6 shadow-2xl dark:shadow-black/50 sm:p-8 backdrop-blur-sm">
          <Suspense fallback={null}>
            <LoginPageClient />
          </Suspense>
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          {t('auth.footerLogin')}{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
