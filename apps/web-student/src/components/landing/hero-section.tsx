'use client';

import { PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

export function HeroSection() {
  const t = useTranslations('Student');

  return (
    <section id="hero" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full max-w-7xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
          <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-orange-500/20 rounded-full blur-[120px] mix-blend-screen" />
        </div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            {t('hero.badge')}
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            {t('hero.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-primary bg-300% animate-gradient">
              {t('hero.titleAlt')}
            </span>{' '}
            <br className="hidden sm:block" />
            {t('hero.titleEnd')}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
            {t('hero.desc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl hover:shadow-[0_0_40px_rgba(239,68,68,0.4)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              {t('hero.trial')}
            </Link>
            <a
              href="#courses"
              className="px-8 py-4 bg-card/80 backdrop-blur-sm text-foreground border-2 border-border text-lg font-bold rounded-xl hover:bg-muted hover:border-muted-foreground/30 transition-all flex items-center justify-center active:scale-95"
            >
              {t('hero.roadmap')}
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none perspective-1000">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-orange-500 rounded-3xl blur-2xl opacity-30 animate-pulse"></div>
          <div className="relative aspect-[4/3] sm:aspect-video bg-slate-950 rounded-3xl shadow-2xl overflow-hidden border border-white/10 flex items-center justify-center group cursor-pointer transform-gpu hover:rotate-y-2 hover:rotate-x-2 transition-transform duration-500">
            {/* Mockup UI overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

            <div className="absolute z-20 text-center">
              <div className="w-20 h-20 bg-primary/90 rounded-full flex items-center justify-center text-white mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary transition-all duration-300 shadow-[0_0_30px_rgba(239,68,68,0.5)] backdrop-blur-md">
                <PlayCircle className="w-10 h-10 ml-1" />
              </div>
              <p className="text-white font-bold text-lg">{t('hero.watchVideo')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
