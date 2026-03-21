'use client';

import { useTranslations } from 'next-intl';
import { Lesson } from '@/lib/course-api';
import { TrendingUp } from 'lucide-react';

interface CourseStatsProps {
  lessons: Lesson[];
}

export function CourseStats({ lessons }: CourseStatsProps) {
  const t = useTranslations('Admin');

  const totalMinutes = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);

  return (
    <div className="bg-gradient-to-br from-primary to-primary/80 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
      <div className="relative z-10">
        <h4 className="text-xl font-black mb-4 flex items-center gap-3 italic">
          <TrendingUp className="w-5 h-5" />
          {t('contentStats')}
        </h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-bold opacity-80">
            <span>{t('totalLectures')}</span>
            <span>{lessons.length}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold opacity-80">
            <span>{t('expectedSize')}</span>
            <span>
              {totalMinutes} {t('minutes')}
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
    </div>
  );
}
