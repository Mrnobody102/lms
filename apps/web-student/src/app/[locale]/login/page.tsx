import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '../../../navigation';
import { LoginPageClient } from './login-page-client';

export default async function LoginPage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'Student' });

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Logo / Brand — rendered on the server, instant HTML */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-6 shadow-lg shadow-primary/25">
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
            {t('auth.loginTitle')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.loginDesc')}</p>
        </div>

        {/* Login Card — only the form is a client component */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl dark:shadow-black/50 sm:p-8">
          <LoginPageClient />
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          {t('auth.footerLogin')}{' '}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
