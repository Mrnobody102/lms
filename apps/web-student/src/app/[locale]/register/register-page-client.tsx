'use client';

import { RegisterForm } from '../../../features/auth/components/register-form';
import { useRouter } from '../../../navigation';

export function RegisterPageClient() {
  const router = useRouter();

  const handleRegisterSuccess = () => {
    router.replace('/courses');
  };

  return <RegisterForm onSuccess={handleRegisterSuccess} />;
}
