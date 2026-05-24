import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PronunciationAssessment } from '../api/use-roleplay';

export function PronunciationScorePanel({
  assessments,
}: {
  assessments: PronunciationAssessment[];
}) {
  const t = useTranslations('Student');
  const latest = assessments.at(-1);

  if (!latest) {
    return null;
  }

  if (latest.status === 'PROCESSING' || latest.status === 'QUEUED') {
    return (
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t('roleplay.pronunciationProcessing')}
      </div>
    );
  }

  if (latest.status === 'FAILED') {
    return (
      <div className="flex items-center gap-2 border-b bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {latest.errorMessage ?? t('roleplay.pronunciationFailed')}
      </div>
    );
  }

  return (
    <div className="border-b bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-4 w-4" />
        {t('roleplay.pronunciationScore', { score: latest.overallScore ?? 0 })}
      </div>
      <div className="grid gap-1 sm:grid-cols-3">
        <span>{t('roleplay.fluencyScore', { score: latest.fluencyScore ?? 0 })}</span>
        <span>{t('roleplay.accuracyScore', { score: latest.accuracyScore ?? 0 })}</span>
        <span>{t('roleplay.completenessScore', { score: latest.completenessScore ?? 0 })}</span>
      </div>
    </div>
  );
}
