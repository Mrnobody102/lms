'use client';

import { useTranslations } from 'next-intl';

export default function CertificateError() {
  const t = useTranslations('Student');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 text-center">
        <h1 className="text-xl font-bold">{t('certificate.verifyNotFound')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('certificate.verifyNotFoundDesc')}</p>
      </div>
    </div>
  );
}
