'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoginForm } from '../../../features/auth/components/login-form';

export function LoginPageClient() {
  const searchParams = useSearchParams();
  const t = useTranslations('Student');
  const registered = searchParams.get('registered') === '1';

  const handleLoginSuccess = () => {
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('next');
    window.location.assign(getSafeReturnUrl(returnUrl) ?? '/courses');
  };

  return (
    <div className="space-y-5">
      {registered && (
        <div className="flex items-start gap-2.5 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm font-medium text-green-700 dark:text-green-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{t('auth.registerSuccessLogin')}</span>
        </div>
      )}
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  );
}

function getSafeReturnUrl(returnUrl: string | null) {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return null;
  }

  return returnUrl;
}
