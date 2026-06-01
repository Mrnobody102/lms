'use client';

import { Calendar, Server } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth.store';
import { SystemTelemetryDashboard } from '@/features/system/components/system-telemetry-dashboard';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PortalSidebar } from '@/components/layout/portal-sidebar';
import { LoginModal } from '@/features/auth/components/login-modal';
import { useLocale, useTranslations } from 'next-intl';

export default function SuperAdminHome() {
  const t = useTranslations('SuperPortal');
  const locale = useLocale();
  const { isAuthenticated, isInitialized } = useAuthStore();

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

      <div className="flex">
        <PortalSidebar />
        <div className="mx-auto w-full max-w-7xl p-4 text-foreground sm:p-6 lg:p-8">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-extrabold">{t('title')}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('subtitle', { date: formatDate(new Date(), locale) })}
              </p>
            </div>
          </div>

          {!isAuthenticated ? <LockedOverview /> : <SystemTelemetryDashboard />}
        </div>
      </div>

      {!isAuthenticated && <LoginModal />}

      <Footer />
    </div>
  );
}

function LockedOverview() {
  const t = useTranslations('SuperPortal.ops');
  return (
    <div className="rounded-xl border bg-card p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Server className="h-6 w-6" />
      </div>
      <h2 className="text-lg font-bold">{t('lockedTitle')}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t('lockedDesc')}</p>
    </div>
  );
}

function formatDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
  }).format(value);
}
