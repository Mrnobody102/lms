'use client';

import { LogIn } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

interface AuthRequiredPanelProps {
  returnTo: string;
}

export function AuthRequiredPanel({ returnTo }: AuthRequiredPanelProps) {
  const t = useTranslations('Student.authRequired');

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-md border border-dashed bg-card px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
        <LogIn className="h-5 w-5" />
      </div>
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('description')}</p>
      <Link
        href={`/login?returnUrl=${encodeURIComponent(returnTo)}`}
        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t('loginCta')}
      </Link>
    </section>
  );
}
