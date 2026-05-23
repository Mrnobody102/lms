'use client';

import { useTranslations } from 'next-intl';
import { Brain, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSkillsReport } from '@/hooks/use-reports';
import type { CourseReportFilters } from '@/lib/reports-api';
import { CsvDownloadButton } from './csv-download-button';
import { AiGenerationModal } from '../practice/ai-generation-modal';
import { Button } from '@/components/ui';

interface SkillAccuracyPanelProps {
  filters?: CourseReportFilters;
  showCsv?: boolean;
}

export function SkillAccuracyPanel({ filters = {}, showCsv = true }: SkillAccuracyPanelProps) {
  const t = useTranslations('Admin');
  const { data, isLoading } = useSkillsReport(filters);
  const [generationModalOpen, setGenerationModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<{ topic: string; skillTags: string } | null>(
    null,
  );
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const csvParams = new URLSearchParams();
  if (filters.courseId) csvParams.set('courseId', filters.courseId);
  if (filters.programId) csvParams.set('programId', filters.programId);
  if (filters.cohortId) csvParams.set('cohortId', filters.cohortId);
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

      {message && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-destructive/5 border-destructive/20 text-destructive'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

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
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground tabular-nums">
                    {t('reports.totalQuestionsValue', { count: skill.totalQuestions })} ·{' '}
                    <span className="text-foreground font-semibold">{skill.accuracy}%</span>
                  </span>
                  {filters.courseId && skill.accuracy < 60 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-xs gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                      onClick={() => {
                        setSelectedSkill({ topic: skill.skill, skillTags: skill.skill });
                        setGenerationModalOpen(true);
                      }}
                      title={t('generatePracticeDesc')}
                    >
                      <Sparkles className="h-3 w-3" />
                      {t('generate')}
                    </Button>
                  )}
                </div>
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

      {selectedSkill && filters.courseId && (
        <AiGenerationModal
          open={generationModalOpen}
          onOpenChange={setGenerationModalOpen}
          courseId={filters.courseId}
          defaultTopic={selectedSkill.topic}
          defaultSkillTags={selectedSkill.skillTags}
          onGenerated={() => {
            // Usually we'd refetch or let the admin know
          }}
          onSuccess={(msg) => setMessage({ type: 'success', text: msg })}
          onError={(msg) => setMessage({ type: 'error', text: msg })}
        />
      )}
    </div>
  );
}
