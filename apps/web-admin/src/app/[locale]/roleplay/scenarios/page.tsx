'use client';

import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { RoleplayManager } from '@/features/roleplay/roleplay-manager';

export default function RoleplayScenarioPage() {
  const t = useTranslations('Admin');

  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-background md:flex-row">
        <AdminSidebar />
        <main className="flex-1 p-6 md:ml-64 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <AdminHeader
              title={t('roleplayScenariosTitle')}
              description={t('roleplayScenariosDesc')}
            />
            <RoleplayManager showCourseSelector />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
