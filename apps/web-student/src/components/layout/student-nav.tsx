'use client';

import { useEffect } from 'react';
import { BookOpen, Dumbbell, LogOut, User as UserIcon } from 'lucide-react';
import { LanguageToggle, ThemeToggle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../navigation';
import { useAuthStore } from '../../features/auth/auth.store';

interface StudentNavProps {
  showLinks?: boolean;
}

export function StudentNav({ showLinks = false }: StudentNavProps) {
  const t = useTranslations('Student');
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <nav className="border-b bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-10">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
          L
        </div>
        <span className="font-bold text-lg tracking-tight">LMS Learning</span>
      </Link>

      {showLinks && (
        <div className="hidden md:flex gap-5 text-sm font-medium text-muted-foreground">
          <Link href="/courses" className="hover:text-primary transition-colors">
            {t('nav.courses')}
          </Link>
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Dumbbell className="h-3.5 w-3.5" />
            {t('nav.practice')}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t('nav.hsk')}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t('nav.vocab')}
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            {t('nav.blog')}
          </Link>
        </div>
      )}

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />
        <div className="w-px h-5 bg-border" />
        {isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium hidden lg:block max-w-[100px] truncate">
              {user?.fullName}
            </p>
            <button
              onClick={() => {
                void logout();
              }}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/5"
              aria-label={t('cta.logout')}
              title={t('cta.logout') || 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all border border-transparent hover:border-border"
            >
              {t('cta.login')}
            </Link>
            <Link
              href="/register"
              className="px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all hover:shadow-md"
            >
              {t('cta.register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
