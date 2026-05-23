'use client';

import {
  Dumbbell,
  FileCheck2,
  KeyRound,
  LogOut,
  User as UserIcon,
  UserPlus,
  Settings,
  MessageSquare,
  Menu,
} from 'lucide-react';
import {
  LanguageToggle,
  ThemeToggle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '../../navigation';
import { useAuthStore } from '../../features/auth/auth.store';
import { NotificationBell } from '../../features/notifications/components/notification-bell';

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
        <>
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

          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-md transition-colors mr-1">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] p-6 flex flex-col gap-6">
                <SheetTitle className="text-left font-bold tracking-tight">Menu</SheetTitle>
                <div className="flex flex-col gap-4 text-sm font-medium text-muted-foreground mt-4">
                  <Link
                    href="/courses"
                    className="hover:text-primary transition-colors py-2 border-b"
                  >
                    {t('nav.courses')}
                  </Link>
                  <Link
                    href="/practice"
                    className="flex items-center gap-2 hover:text-primary transition-colors py-2 border-b"
                  >
                    <Dumbbell className="h-4 w-4" />
                    {t('nav.practice')}
                  </Link>
                  <Link
                    href="/roleplay"
                    className="flex items-center gap-2 hover:text-primary transition-colors py-2 border-b"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Roleplay
                  </Link>
                  <Link
                    href="/exams"
                    className="flex items-center gap-2 hover:text-primary transition-colors py-2 border-b"
                  >
                    <FileCheck2 className="h-4 w-4" />
                    {t('nav.exams')}
                  </Link>
                  <Link
                    href="/activation"
                    className="flex items-center gap-2 hover:text-primary transition-colors py-2 border-b"
                  >
                    <KeyRound className="h-4 w-4" />
                    {t('nav.activation')}
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </>
      )}

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle label={t('themeToggle')} />
        <LanguageToggle />
        <div className="w-px h-5 bg-border" />
        {!isInitialized ? (
          <div className="w-20 h-8 animate-pulse bg-muted rounded-lg" />
        ) : isAuthenticated ? (
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-1.5 cursor-pointer rounded-lg hover:bg-muted p-1 pr-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium hidden lg:block max-w-[100px] truncate">
                    {user?.fullName}
                  </p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 w-full">
                    <UserIcon className="h-4 w-4" />
                    <span>{t('nav.profile', { defaultMessage: 'Profile' })}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center gap-2 w-full">
                    <Settings className="h-4 w-4" />
                    <span>{t('nav.settings')}</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <NotificationBell />
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
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('cta.register')}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
