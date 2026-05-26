'use client';

import { Sparkles, Users, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeaturesSection() {
  const t = useTranslations('Student');

  const features = [
    {
      title: t('landing.features.ai'),
      desc: t('landing.features.aiDesc'),
      icon: Sparkles,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      border: 'group-hover:border-blue-500/30',
    },
    {
      title: t('landing.features.community'),
      desc: t('landing.features.communityDesc'),
      icon: Users,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'group-hover:border-orange-500/30',
    },
    {
      title: t('landing.features.quality'),
      desc: t('landing.features.qualityDesc'),
      icon: Award,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'group-hover:border-emerald-500/30',
    },
  ];

  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
            {t('landing.features.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground font-medium">
            {t('landing.features.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((item, i) => (
            <div
              key={i}
              className={`group p-8 rounded-3xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${item.border}`}
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${item.bg} ${item.color}`}
              >
                <item.icon className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-base font-medium">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
