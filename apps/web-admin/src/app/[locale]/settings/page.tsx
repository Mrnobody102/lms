'use client';

import { useTranslations } from 'next-intl';
import { User, Shield } from 'lucide-react';
import { ProfileForm } from '../../../features/user/components/profile-form';
import { ChangePasswordForm } from '../../../features/user/components/change-password-form';

export default function SettingsPage() {
  const t = useTranslations('Admin');

  return (
    <div className="container max-w-5xl py-8 space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('accountSettings.title')}</h1>
        <p className="text-muted-foreground">{t('accountSettings.subtitle')}</p>
      </div>

      <div className="grid gap-10">
        {/* Profile Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">{t('accountSettings.profile.title')}</h2>
          </div>
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-6">
              {t('accountSettings.profile.description')}
            </p>
            <ProfileForm />
          </div>
        </section>

        {/* Security Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Shield className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-semibold">{t('accountSettings.security.title')}</h2>
          </div>
          <div className="bg-card border rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-muted-foreground mb-6">
              {t('accountSettings.security.description')}
            </p>
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </div>
  );
}
