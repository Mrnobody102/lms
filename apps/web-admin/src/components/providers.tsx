'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/auth.store';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((state) => state.user);
  const identity = `${user?.tenantId ?? 'guest'}:${user?.id ?? 'guest'}:${user?.role ?? 'guest'}`;
  useEffect(() => {
    setMounted(true);
    void checkAuth();
  }, [checkAuth]);
  if (!mounted) return null;
  return <SessionQueries key={identity}>{children}</SessionQueries>;
}

function SessionQueries({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Increased staleTime to 5 mins for better caching
            gcTime: 30 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(
    () => () => {
      void queryClient.cancelQueries();
      queryClient.clear();
    },
    [queryClient],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
