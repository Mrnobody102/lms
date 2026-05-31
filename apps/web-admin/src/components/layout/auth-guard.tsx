'use client';

import { useEffect } from 'react';
import { hasCapability, type Capability } from '@repo/shared';
import { useAuthStore } from '@/features/auth/auth.store';
import { useRouter } from '@/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredCapability?: Capability;
  loaderMessage?: string;
}

export function AuthGuard({
  children,
  requiredCapability,
  loaderMessage = 'Loading...',
}: AuthGuardProps) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (
        user &&
        user.role !== 'ADMIN' &&
        user.role !== 'SUPER_ADMIN' &&
        user.role !== 'INSTRUCTOR'
      ) {
        router.push('/login?error=unauthorized');
      } else if (requiredCapability && !hasCapability(user?.role, requiredCapability)) {
        router.push('/?error=forbidden');
      }
    }
  }, [isInitialized, isAuthenticated, user, router, requiredCapability]);

  const isAuthorized =
    user &&
    (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'INSTRUCTOR') &&
    (!requiredCapability || hasCapability(user.role, requiredCapability));

  if (!isInitialized || !isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{loaderMessage}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
