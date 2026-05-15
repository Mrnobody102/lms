'use client';

import { useTranslations } from 'next-intl';
import { Brain } from 'lucide-react';
import { useSkillsReport } from '@/hooks/use-reports';
import { CsvDownloadButton } from './csv-download-button';

interface SkillAccuracyPanelProps {
  filters?: { courseId?: string; programId?: string };
  showCsv?: boolean;
}

export function SkillAccuracyPanel({ filters = {}, showCsv = true }: SkillAccuracyPanelProps) {
  const t = useTranslations('Admin');
  const { data, isLoading } = useSkillsReport(filters);

  const csvParams = new URLSearchParams();
  if (filters.courseId) csvParams.set('courseId', filters.courseId);
  if (filters.programId) csvParams.set('programId', filters.programId);
  const csvPath = `/admin/reports/skills.csv${csvParams.toString() ? `?${csvParams.toString()}` : ''}`;

  return (
    <div className="rounded-md border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{t('reports.accuracyBySkill')}</h3>
            <p className="text-xs text-muted-foreground">{t('reports.accuracyBySkillDesc')}</p>
          </div>
        </div>
        {showCsv && data && data.accuracyBySkill.length > 0 && (
          <CsvDownloadButton path={csvPath} filename="skills.csv" />
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : !data || data.accuracyBySkill.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('reports.noData')}</p>
      ) : (
        <ul className="space-y-3">
          {data.accuracyBySkill.map((skill) => (
            <li key={skill.skill}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium capitalize">{skill.skill}</span>
                <span className="text-muted-foreground tabular-nums">
                  {t('reports.totalQuestionsValue', { count: skill.totalQuestions })} ·{' '}
                  <span className="text-foreground font-semibold">{skill.accuracy}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${skill.accuracy}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
