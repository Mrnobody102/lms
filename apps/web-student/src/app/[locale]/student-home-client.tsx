'use client';

import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StudentNav } from '@/components/layout/student-nav';
import LearningDashboard from '@/components/dashboard/learning-dashboard';
import { useAuthStore } from '@/features/auth/auth.store';
import { studentApi, type StudentTodayResponse } from '@/lib/student-api';

export function StudentHomeClient({
  guest,
  initialData,
}: {
  guest: ReactNode;
  initialData: StudentTodayResponse | null;
}) {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data, isError, isLoading } = useQuery({
    queryKey: ['student', 'today'],
    queryFn: studentApi.getToday,
    enabled: !initialData && isInitialized && isAuthenticated,
    staleTime: 60 * 1000,
  });

  if (initialData) {
    return <LearningDashboard data={initialData} />;
  }

  if (isInitialized && isAuthenticated) {
    if (isLoading) {
      return <StudentHomeLoading />;
    }

    return <LearningDashboard data={isError ? null : (data ?? null)} />;
  }

  return <>{guest}</>;
}

function StudentHomeLoading() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-24 animate-pulse rounded-md border bg-muted/40" />
          <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <div className="space-y-6">
              <div className="h-52 animate-pulse rounded-md border bg-muted/40" />
              <div className="h-40 animate-pulse rounded-md border bg-muted/40" />
            </div>
            <div className="h-80 animate-pulse rounded-md border bg-muted/40" />
          </div>
        </div>
      </main>
    </div>
  );
}
