'use client';

import { useState } from 'react';
import { Building2, CheckCircle2, Globe2, PauseCircle, PlusCircle, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useAuthStore } from '@/features/auth/auth.store';
import { TenantFormModal } from '@/features/tenants/components/tenant-form-modal';
import { TenantList } from '@/features/tenants/components/tenant-list';
import { useTenants } from '@/hooks/use-tenants';

export default function TenantsPage() {
  const t = useTranslations('SuperPortal');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const { data: tenants = [], isLoading } = useTenants({
    enabled: isAuthenticated,
    includeInactive: true,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Server className="mb-4 h-10 w-10 animate-pulse text-primary" />
        <p className="font-medium text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="flex">
        <PortalSidebar />
        <main className="mx-auto w-full max-w-7xl p-4 text-foreground sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold">{t('tenantsPage.title')}</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {t('tenantsPage.subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
              disabled={!isAuthenticated}
            >
              <PlusCircle className="h-4 w-4" />
              {t('newTenant')}
            </button>
          </div>

          {!isAuthenticated ? (
            <LockedTenants />
          ) : (
            <>
              <div className="mb-6 grid gap-3 md:grid-cols-4">
                <TenantSummaryMetric
                  label={t('tenantSummary.total')}
                  value={tenants.length}
                  icon={Building2}
                />
                <TenantSummaryMetric
                  label={t('tenantSummary.active')}
                  value={tenants.filter((tenant) => tenant.isActive).length}
                  icon={CheckCircle2}
                />
                <TenantSummaryMetric
                  label={t('tenantSummary.inactive')}
                  value={tenants.filter((tenant) => !tenant.isActive).length}
                  icon={PauseCircle}
                />
                <TenantSummaryMetric
                  label={t('tenantSummary.customDomains')}
                  value={tenants.filter((tenant) => tenant.domain).length}
                  icon={Globe2}
                />
              </div>
              <TenantList tenants={tenants} loading={isLoading} />
            </>
          )}
        </main>
      </div>

      <TenantFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {!isAuthenticated && <LoginModal />}
      <Footer />
    </div>
  );
}

function TenantSummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function LockedTenants() {
  const t = useTranslations('SuperPortal.ops');
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Building2 className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold">{t('lockedTitle')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('lockedDesc')}</p>
    </div>
  );
}
