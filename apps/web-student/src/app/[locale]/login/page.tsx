'use client';

import { useParams } from 'next/navigation';
import { LoginForm } from '../../../features/auth/components/login-form';
import { Link } from '../../../navigation';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Student');
  const params = useParams();
  const locale = (params.locale as string) || 'vi';

  const handleLoginSuccess = () => {
    window.location.href = `/${locale}/courses`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
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
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('auth.loginTitle')}</h1>
          <p className="text-sm text-zinc-500 mt-1">{t('auth.loginDesc')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <LoginForm onSuccess={handleLoginSuccess} />
        </div>

        {/* Register Link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
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
