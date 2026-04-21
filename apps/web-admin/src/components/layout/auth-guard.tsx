'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/auth.store';

interface AuthGuardProps {
  children: React.ReactNode;
  loaderMessage?: string;
}

export function AuthGuard({ children, loaderMessage = 'Loading...' }: AuthGuardProps) {
  const { isAuthenticated, checkAuth, isInitialized } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.match(/^\/(en|vi)(?:\/|$)/)?.[1] || 'vi';

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/login`);
    }
  }, [isInitialized, isAuthenticated, locale, router]);

  if (!isInitialized || !isAuthenticated) {
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
