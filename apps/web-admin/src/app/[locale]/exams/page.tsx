'use client';

import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { ExamsManager } from '@/features/exams/exams-manager';

export default function AdminExamsPage() {
  const t = useTranslations('Admin');

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col md:flex-row bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('exams')} description={t('examManagementDesc')} />
            <ExamsManager showCourseSelector />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
