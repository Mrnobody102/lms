'use client';

import { Menu, UserPlus } from 'lucide-react';
import {
  LanguageToggle,
  ThemeToggle,
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function LandingNav() {
  const t = useTranslations('Student');

  const anchorLinks = [
    { href: '#hero', label: t('landing.nav.home') },
    { href: '#features', label: t('landing.nav.highlights') },
    { href: '#courses', label: t('landing.nav.courses') },
    { href: '#contact', label: t('landing.nav.contact') },
  ];

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl transition-colors duration-300">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-orange-500 font-bold text-white shadow-lg shadow-primary/20">
            L
          </div>
          <span className="hidden truncate text-lg font-extrabold tracking-tight sm:inline bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            LMS Learning
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden min-w-0 flex-1 justify-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {anchorLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleScroll(e, item.href)}
              className="transition-colors hover:text-primary hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="flex items-center lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-6 sm:w-[350px]">
                <SheetTitle className="text-left font-bold tracking-tight mb-6">Menu</SheetTitle>
                <div className="flex flex-col gap-4 text-base font-medium">
                  {anchorLinks.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => handleScroll(e, item.href)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <ThemeToggle label={t('themeToggle')} />
          <LanguageToggle />
          <div className="w-px h-5 bg-border mx-1" />

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              href="/login"
              className="hidden rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground sm:inline-flex"
            >
              {t('cta.login')}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {t('cta.register')}
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
