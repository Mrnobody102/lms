'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '../../../features/auth/components/login-form';
import { useRouter } from '../../../navigation';

export function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLoginSuccess = () => {
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('next');
    router.replace(getSafeReturnUrl(returnUrl) ?? '/courses');
  };

  return <LoginForm onSuccess={handleLoginSuccess} />;
}

function getSafeReturnUrl(returnUrl: string | null) {
  if (!returnUrl || !returnUrl.startsWith('/') || returnUrl.startsWith('//')) {
    return null;
  }

  return returnUrl;
}
