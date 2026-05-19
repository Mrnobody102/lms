import { BrainCircuit, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useSrsSummary } from '@/hooks/use-srs';

export function SrsReviewCard() {
  const t = useTranslations('Student.srs');
  const { data: summary, isLoading } = useSrsSummary();

  if (isLoading) {
    return (
      <section className="rounded-md border p-6 flex flex-col items-center justify-center text-center opacity-50">
        <BrainCircuit className="h-8 w-8 text-muted-foreground animate-pulse mb-3" />
        <p className="text-sm font-semibold">{t('loading')}</p>
      </section>
    );
  }

  const dueNow = summary?.dueNow ?? 0;

  if (dueNow === 0) {
    return (
      <section className="rounded-md border border-dashed p-6 bg-muted/20 flex flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600 mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold">{t('dailyReviewEmpty')}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{t('dailyReviewEmptyDesc')}</p>
      </section>
    );
  }

  return (
    <section className="rounded-md border-2 border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
      <div className="absolute right-0 top-0 -translate-y-1/4 translate-x-1/4 opacity-10">
        <BrainCircuit className="h-48 w-48 text-primary" />
      </div>
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary mb-3">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          {t('dailyReviewTitle')}
        </div>
        <h3 className="text-2xl font-bold mb-1">{t('dailyReviewSubtitle', { count: dueNow })}</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">{t('dailyReviewDesc')}</p>
        <Link
          href="/review"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0"
        >
          <BrainCircuit className="h-4 w-4" />
          {t('dailyReviewCta')}
        </Link>
      </div>
    </section>
  );
}
