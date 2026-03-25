'use client';

import { useTranslations } from 'next-intl';
import { Lesson } from '@/lib/course-api';
import { BookOpen, Clock, Layers } from 'lucide-react';

interface CourseStatsProps {
  lessons: Lesson[];
}

export function CourseStats({ lessons }: CourseStatsProps) {
  const t = useTranslations('Admin');
  const totalMinutes = lessons.reduce((acc, l) => acc + (l.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {t('contentStats')}
      </h4>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="w-4 h-4" />
            <span>{t('totalLectures')}</span>
          </div>
          <span className="font-semibold">{lessons.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{t('expectedSize')}</span>
          </div>
          <span className="font-semibold">{hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}</span>
        </div>
      </div>
    </div>
  );
}
