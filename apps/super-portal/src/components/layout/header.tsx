'use client';

import { useAuthStore } from '@/features/auth/auth.store';
import {
  ThemeToggle,
  LanguageToggle,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@repo/ui';
import { UserCircle, Menu } from 'lucide-react';

import { useTranslations } from 'next-intl';

export function Header() {
  const t = useTranslations('SuperPortal');
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-6 flex flex-col gap-6">
              <SheetTitle className="text-left font-bold tracking-tight">Menu</SheetTitle>
              <div className="flex flex-col gap-4 text-sm font-medium mt-4">
                <button className="text-left text-muted-foreground hover:text-primary transition-colors py-2 border-b">
                  {t('nav.docs')}
                </button>
                {isAuthenticated && (
                  <button
                    onClick={() => void logout()}
                    className="text-left text-destructive hover:opacity-80 transition-colors py-2 border-b"
                  >
                    {t('nav.logout')}
                  </button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex shrink-0 items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20">
          S
        </div>
        <span className="font-bold text-base sm:text-lg tracking-wide whitespace-nowrap">
          Super Portal
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border hidden sm:inline-block">
          V1.0
        </span>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
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
            className="text-sm font-medium text-destructive hover:opacity-80 transition-colors mr-2 hidden md:block"
          >
            {t('nav.logout')}
          </button>
        )}
        <div
          className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-muted-foreground shrink-0"
          aria-label={t('accountAvatar')}
        >
          <UserCircle className="w-5 h-5" />
        </div>
      </div>
    </header>
  );
}
