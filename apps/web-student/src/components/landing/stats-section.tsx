'use client';

import { useTranslations } from 'next-intl';

export function StatsSection() {
  const t = useTranslations('Student');

  const stats = [
    { value: '10,000+', label: t('landing.stats.students') },
    { value: '50+', label: t('landing.stats.teachers') },
    { value: '99%', label: t('landing.stats.passRate') },
    { value: '100+', label: t('landing.stats.courses') },
  ];

  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50">
          {stats.map((stat, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-foreground to-foreground/60 mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base font-semibold text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
