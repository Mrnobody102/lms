'use client';

import { useState } from 'react';
import { Server, PlusCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { TenantStats } from '@/features/tenants/components/tenant-stats';
import { TenantFormModal } from '@/features/tenants/components/tenant-form-modal';
import { TenantList } from '@/features/tenants/components/tenant-list';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useTenants } from '@/hooks/use-tenants';
import { useLocale, useTranslations } from 'next-intl';

export default function SuperAdminHome() {
  const t = useTranslations('SuperPortal');
  const locale = useLocale();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: tenants = [], isLoading } = useTenants({ enabled: isAuthenticated });
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Server className="w-10 h-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <Header />

      <div className="mx-auto max-w-7xl p-4 text-foreground sm:p-6 lg:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-extrabold">{t('title')}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('subtitle', { date: formatDate(new Date(), locale) })}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            {t('newTenant')}
          </button>
        </div>

        <TenantStats totalActiveTenants={tenants.length} />
        <TenantList tenants={tenants} loading={isLoading} />
      </div>

      <TenantFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {!isAuthenticated && <LoginModal />}

      <Footer />
    </div>
  );
}

function formatDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
  }).format(value);
}
