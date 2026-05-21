'use client';

import { LoginForm } from '../../../features/auth/components/login-form';
import { useRouter } from '../../../navigation';

export function LoginPageClient() {
  const router = useRouter();

  const handleLoginSuccess = () => {
    router.replace('/courses');
  };

  return <LoginForm onSuccess={handleLoginSuccess} />;
}
