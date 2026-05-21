'use client';

import { Link } from '../../navigation';
import { PlayCircle, Trophy, BookOpen, User as UserIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../../features/auth/auth.store';
import { StudentNav } from '../../components/layout/student-nav';

// Code-split: dashboard is a heavy module (recharts, many widgets).
// Users who aren't logged in never download it.
const LearningDashboard = dynamic(() => import('../../components/dashboard/learning-dashboard'), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  const t = useTranslations('Student');
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <LearningDashboard />;
  }

  return (
    <div className="min-h-screen font-sans">
      <StudentNav showLinks />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
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
      <section className="bg-card/50 py-24 border-t border-b transition-colors duration-300">
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
    </div>
  );
}
