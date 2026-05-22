'use client';

import {
  Dumbbell,
  FileCheck2,
  KeyRound,
  LogIn,
  LogOut,
  User as UserIcon,
  UserPlus,
  Settings,
  MessageSquare,
} from 'lucide-react';
import { LanguageToggle, ThemeToggle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../navigation';
import { useAuthStore } from '../../features/auth/auth.store';

interface StudentNavProps {
  showLinks?: boolean;
}

export function StudentNav({ showLinks = false }: StudentNavProps) {
  const t = useTranslations('Student');
  const { isAuthenticated, user, logout, isInitialized } = useAuthStore();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur-md transition-colors duration-300 sm:px-6">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20">
          L
        </div>
        <span className="truncate text-base font-bold tracking-tight sm:text-lg">LMS Learning</span>
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
          <Link
            href="/roleplay"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Roleplay
          </Link>
          <Link
            href="/exams"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            {t('nav.exams')}
          </Link>
          <Link
            href="/activation"
            className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {t('nav.activation')}
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

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle label={t('themeToggle')} />
        <LanguageToggle />
        <div className="w-px h-5 bg-border" />
        {!isInitialized ? (
          <div className="w-20 h-8 animate-pulse bg-muted rounded-lg" />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <UserIcon className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium hidden lg:block max-w-[100px] truncate">
              {user?.fullName}
            </p>
            <Link
              href="/settings"
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary transition-all rounded-lg hover:bg-primary/5"
              aria-label={t('nav.settings')}
              title={t('nav.settings')}
            >
              <Settings className="w-4 h-4" />
            </Link>
            <button
              onClick={() => {
                void logout();
              }}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/5"
              aria-label={t('cta.logout')}
              title={t('cta.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg border border-transparent px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              {t('cta.login')}
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground sm:hidden"
              aria-label={t('cta.login')}
              title={t('cta.login')}
            >
              <LogIn className="h-4 w-4" />
            </Link>
            <Link
              href="/register"
              className="hidden rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 hover:shadow-md sm:inline-flex"
            >
              {t('cta.register')}
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:opacity-90 hover:shadow-md sm:hidden"
              aria-label={t('cta.register')}
              title={t('cta.register')}
            >
              <UserPlus className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
