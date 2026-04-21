'use client';

import { Link } from '../../navigation';
import { BookOpen, PlayCircle, Trophy, User as UserIcon, LogOut } from 'lucide-react';
import { ThemeToggle, LanguageToggle } from '@repo/ui';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { AuthModal } from '../../features/auth/components/auth-modal';
import { useAuthStore } from '../../features/auth/auth.store';

export default function Home() {
  const t = useTranslations('Student');
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    tab: 'login' | 'register';
  }>({
    open: false,
    tab: 'login',
  });

  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  // Guard: if already authenticated, don't allow modal to open
  const canOpenModal = isAuthenticated === false;

  return (
    <div className="min-h-screen font-sans">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            L
          </div>
          <span className="font-bold text-lg tracking-tight">LMS Learning</span>
        </div>
        <div className="flex gap-5 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">
            {t('nav.courses')}
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

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-background">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {t('hero.badge')}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            {t('hero.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              {t('hero.titleAlt')}
            </span>{' '}
            {t('hero.titleEnd')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
            {t('hero.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={isAuthenticated ? '/courses' : '/register'}
              className="px-10 py-5 bg-primary text-primary-foreground text-lg font-black rounded-2xl hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <PlayCircle className="w-6 h-6" />
              {t('hero.trial')}
            </Link>
            <Link
              href={isAuthenticated ? '/courses' : '/login'}
              className="px-10 py-5 bg-card text-foreground border border-border/50 text-lg font-black rounded-2xl hover:bg-muted hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
            >
              {t('hero.roadmap')}
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative aspect-video bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border flex items-center justify-center group cursor-pointer">
            <div className="text-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">{t('hero.watchVideo')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-card/50 py-24 border-t border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">{t('features.whyUs')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
              {t('features.whyUsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('features.items.hsk.title'),
                icon: Trophy,
                desc: t('features.items.hsk.desc'),
              },
              {
                title: t('features.items.library.title'),
                icon: BookOpen,
                desc: t('features.items.library.desc'),
              },
              {
                title: t('features.items.community.title'),
                icon: UserIcon,
                desc: t('features.items.community.desc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-background rounded-xl shadow-sm border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-12 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-medium">&copy; 2026 LMS Platform. All rights reserved.</p>
        </div>
      </footer>

      {canOpenModal && (
        <AuthModal
          isOpen={authModal.open}
          onClose={() => setAuthModal({ ...authModal, open: false })}
          defaultTab={authModal.tab}
        />
      )}
    </div>
  );
}
