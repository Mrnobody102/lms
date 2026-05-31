'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { FullScreenLoader } from '@repo/ui';
import { RegisterForm } from '../../../features/auth/components/register-form';
import { useRouter } from '../../../navigation';

export function RegisterPageClient() {
  const router = useRouter();
  const t = useTranslations('Student');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleRegisterSuccess = () => {
    setIsRedirecting(true);
    router.replace('/login?registered=1');
  };

  return (
    <>
      <RegisterForm onSuccess={handleRegisterSuccess} />
      <FullScreenLoader isOpen={isRedirecting} text={t('auth.redirecting')} />
    </>
  );
}
