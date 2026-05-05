'use client';

import { useAuthStore } from '@/features/auth/auth.store';
import { ThemeToggle, LanguageToggle } from '@repo/ui';
import { UserCircle } from 'lucide-react';

import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations('SuperPortal');
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20">
          S
        </div>
        <span className="font-bold text-lg tracking-wide">Super Portal</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border">
          V1.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:block">
          {t('nav.docs')}
        </button>
        <ThemeToggle label={t('themeToggle')} />
        <LanguageToggle />
        {isAuthenticated && (
          <button
            onClick={() => {
              void logout();
            }}
            className="text-sm font-medium text-destructive hover:opacity-80 transition-colors mr-2"
          >
            {t('nav.logout')}
          </button>
        )}
        <div
          className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-muted-foreground"
          aria-label={t('accountAvatar')}
        >
          <UserCircle className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
