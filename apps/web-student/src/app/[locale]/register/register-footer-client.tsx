'use client';

import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../../features/auth/auth.store';
import { Link } from '../../../navigation';

export function RegisterFooterClient() {
  const t = useTranslations('Student');
  const { loading } = useAuthStore();

  return (
    <p className="text-center text-sm text-muted-foreground mt-6">
      {t('auth.footerRegister')}{' '}
      <Link
        href="/login"
        tabIndex={loading ? -1 : undefined}
        aria-disabled={loading}
        onClick={(e) => loading && e.preventDefault()}
        className={`font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm ${
          loading
            ? 'text-muted-foreground pointer-events-none opacity-60'
            : 'text-primary hover:text-primary/80'
        }`}
      >
        {t('auth.signInLink')}
      </Link>
    </p>
  );
}
