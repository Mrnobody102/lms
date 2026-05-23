'use client';

import { TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSkillMasteryTrend } from '@/hooks/use-skills';
import type { SkillMasteryTrendSkill } from '@/lib/skill-api';

const FALLBACK_COLORS = [
  'hsl(var(--primary))',
  '#22c55e',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];

function displayName(skill: SkillMasteryTrendSkill, locale: string) {
  if (locale.startsWith('vi') && skill.nameVi) return skill.nameVi;
  return skill.name;
}

export function SkillMasteryTrendPanel({ locale }: { locale: string }) {
  const t = useTranslations('Student.skillMasteryTrend');
  const { data, isLoading, error } = useSkillMasteryTrend(30);

  if (isLoading) {
    return <div className="h-80 rounded-2xl bg-card animate-pulse border border-border/50" />;
  }

  if (error || !data || data.trend.length === 0 || data.skills.length === 0) {
    return null;
  }

  const activeSkills = data.skills.filter((skill) =>
    data.trend.some((day) => typeof day[skill.code] === 'number'),
  );

  if (activeSkills.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
          <TrendingUp className="h-5 w-5" />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">{t('title')}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </header>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
              }}
              cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeOpacity: 0.25 }}
              itemStyle={{ fontSize: 13 }}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                marginBottom: '4px',
              }}
            />
            <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
            {activeSkills.map((skill, index) => (
              <Line
                key={skill.code}
                type="monotone"
                dataKey={skill.code}
                name={displayName(skill, locale)}
                stroke={skill.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
