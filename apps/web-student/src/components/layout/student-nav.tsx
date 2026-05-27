'use client';

import {
  BookOpen,
  Dumbbell,
  FileCheck2,
  Home,
  KeyRound,
  LogOut,
  User as UserIcon,
  UserPlus,
  Settings,
  Menu,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  LanguageToggle,
  ThemeToggle,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '../../navigation';
import { useAuthStore } from '../../features/auth/auth.store';
import { NotificationBell } from '../../features/notifications/components/notification-bell';

interface StudentNavProps {
  showLinks?: boolean;
}

interface StudentNavItem {
  href?: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}

export function StudentNav({ showLinks = false }: StudentNavProps) {
  const t = useTranslations('Student');
  const pathname = usePathname();
  const { isAuthenticated, user, logout, isInitialized } = useAuthStore();

  const mainItems: StudentNavItem[] = [
    { href: '/', icon: Home, label: t('nav.home') },
    { href: '/courses', icon: BookOpen, label: t('nav.courses') },
    { href: '/practice', icon: Dumbbell, label: t('nav.practice') },
    { href: '/exams', icon: FileCheck2, label: t('nav.exams') },
  ];

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (active: boolean) =>
    `inline-flex h-9 items-center gap-1.5 rounded-md px-3 transition-colors ${
      active ? 'bg-primary/10 text-primary' : 'hover:bg-muted hover:text-primary'
    }`;

  const shouldShowLinks = showLinks && isAuthenticated;

  return (
    <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md transition-colors duration-300">
      <nav className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground shadow-lg shadow-primary/20">
            L
          </div>
          <span className="hidden truncate text-base font-bold tracking-tight sm:inline sm:text-lg">
            LMS Learning
          </span>
        </Link>

        {shouldShowLinks && (
          <div className="hidden min-w-0 flex-1 justify-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
            {mainItems.map((item) => (
              <Link
                key={item.href}
                href={item.href ?? '/'}
                className={linkClass(isActive(item.href))}
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {shouldShowLinks && (
            <div className="flex items-center lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label={t('nav.menu')}
                    title={t('nav.menu')}
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-[280px] flex-col gap-4 p-6 sm:w-[350px]"
                  aria-describedby={undefined}
                >
                  <SheetTitle className="text-left font-bold tracking-tight">
                    {t('nav.menu')}
                  </SheetTitle>

                  <MobileGroup items={mainItems} isActive={isActive} t={t} />
                </SheetContent>
              </Sheet>
            </div>
          )}
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
                    <p className="text-sm font-medium hidden 2xl:block max-w-[100px] truncate">
                      {user?.fullName}
                    </p>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {user?.fullName && (
                    <>
                      <DropdownMenuLabel className="truncate">{user.fullName}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 w-full">
                      <UserIcon className="h-4 w-4" />
                      <span>{t('nav.profile')}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/activation" className="flex items-center gap-2 w-full">
                      <KeyRound className="h-4 w-4" />
                      <span>{t('nav.activation')}</span>
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
    </header>
  );
}

function MobileGroup({
  title,
  items,
  isActive,
  t,
}: {
  title?: string;
  items: StudentNavItem[];
  isActive: (href?: string) => boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm font-medium text-muted-foreground">
      {title && (
        <p className="px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </p>
      )}
      {items.map((item) => {
        const content = (
          <>
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </>
        );

        if (item.disabled) {
          return (
            <button
              key={item.label}
              type="button"
              disabled
              aria-disabled="true"
              title={t('nav.comingSoon')}
              className="flex min-h-11 cursor-not-allowed items-center gap-3 rounded-md px-2 py-2 text-muted-foreground/50"
            >
              {content}
            </button>
          );
        }

        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href ?? '/'}
            className={`flex min-h-11 items-center gap-3 rounded-md px-2 py-2 transition-colors ${
              active ? 'bg-primary/10 text-primary' : 'hover:bg-muted hover:text-primary'
            }`}
          >
            {content}
          </Link>
        );
      })}
    </div>
  );
}
