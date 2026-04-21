'use client';

import { useEffect, useState } from 'react';
import { Server, PlusCircle, Calendar } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { TenantStats } from '@/features/tenants/components/tenant-stats';
import { TenantFormModal } from '@/features/tenants/components/tenant-form-modal';
import { TenantList } from '@/features/tenants/components/tenant-list';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useTenants } from '@/hooks/use-tenants';
import { format } from 'date-fns';

import { useTranslations } from 'next-intl';

export default function SuperAdminHome() {
  const t = useTranslations('SuperPortal');
  const { isAuthenticated, checkAuth, isInitialized } = useAuthStore();
  const { data: tenants = [], isLoading } = useTenants({ enabled: isAuthenticated });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

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

      <div className="p-8 max-w-7xl mx-auto text-foreground">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">{t('title')}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t('subtitle', { date: format(new Date(), 'MMMM d, yyyy') })}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground text-sm font-semibold rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
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
