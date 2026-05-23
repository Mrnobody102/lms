'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default function Loading() {
  const t = useTranslations('Admin');

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <AdminSidebar />
      <main className="flex-1 md:ml-64 p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        </div>
      </main>
    </div>
  );
}
