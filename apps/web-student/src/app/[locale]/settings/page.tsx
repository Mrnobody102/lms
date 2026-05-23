'use client';

import { useTranslations } from 'next-intl';
import { User, Shield } from 'lucide-react';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { useAuthStore } from '@/features/auth/auth.store';
import { StudentNav } from '../../../components/layout/student-nav';
import { ProfileForm } from '../../../features/user/components/profile-form';
import { ChangePasswordForm } from '../../../features/user/components/change-password-form';
import { SessionManager } from '../../../features/user/components/session-manager';

export default function SettingsPage() {
  const t = useTranslations('Student');
  const { isAuthenticated, isInitialized } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <StudentNav showLinks />

      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/settings" />
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
              <p className="text-muted-foreground">{t('settings.subtitle')}</p>
            </div>

            <div className="grid gap-10">
              {/* Profile Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 border-b pb-2">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{t('settings.profile.title')}</h2>
                </div>
                <div className="rounded-xl border bg-card p-6 shadow-sm">
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
                <div className="rounded-xl border bg-card p-6 shadow-sm">
                  <p className="mb-6 text-sm text-muted-foreground">
                    {t('settings.security.description')}
                  </p>
                  <ChangePasswordForm />
                </div>
              </section>

              {/* Sessions Section */}
              <SessionManager />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
