'use client';

import { useTranslations } from 'next-intl';
import { User, Shield } from 'lucide-react';
import { ProfileForm } from '../../../features/user/components/profile-form';
import { ChangePasswordForm } from '../../../features/user/components/change-password-form';
import { SessionManager } from '../../../features/user/components/session-manager';

import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';

export default function SettingsPage() {
  const t = useTranslations('Admin');

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-10">
            <AdminHeader title={t('settings.title')} description={t('settings.subtitle')} />

            <div className="grid gap-10">
              {/* Profile Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('settings.profile.title')}</h2>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t('settings.profile.description')}
                  </p>
                  <ProfileForm />
                </div>
              </section>

              {/* Security Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <h2 className="text-xl font-semibold">{t('settings.security.title')}</h2>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t('settings.security.description')}
                  </p>
                  <ChangePasswordForm />
                </div>
              </section>

              {/* Sessions Section */}
              <SessionManager />
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
