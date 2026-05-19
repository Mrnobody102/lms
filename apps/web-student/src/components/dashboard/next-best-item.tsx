import { BrainCircuit, PlayCircle, Dumbbell, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useProgressSummary } from '@/hooks/use-progress';
import { useSkillMastery } from '@/hooks/use-skills';
import { getCourseProgressHref } from '@/lib/course-progress-utils';

export function NextBestItem() {
  const t = useTranslations('Student.srs.nextBestItem');
  const { data: summary, isLoading: isSummaryLoading } = useProgressSummary();
  const { data: masteryData, isLoading: isMasteryLoading } = useSkillMastery();

  if (isSummaryLoading || isMasteryLoading) return null;

  const dueNow = summary?.srsDue?.dueNow ?? 0;
  const activeCourse = summary?.activeCourse;
  const continueLesson = activeCourse?.continueLesson;
  const weakSkill = masteryData?.find((m) => m.mastery < 0.3);

  if (dueNow > 0) {
    return (
      <NextBestCard
        icon={<BrainCircuit className="h-5 w-5" />}
        title={t('reviewDueValue', { count: dueNow })}
        subtitle={t('reviewDueDesc')}
        href="/review"
        cta={t('startCta')}
        colorClass="bg-primary text-primary-foreground hover:bg-primary/90"
        iconBgClass="bg-primary-foreground/20 text-primary-foreground"
      />
    );
  }

  if (continueLesson && activeCourse) {
    return (
      <NextBestCard
        icon={<PlayCircle className="h-5 w-5" />}
        title={t('continueLesson')}
        subtitle={continueLesson.title}
        href={getCourseProgressHref(activeCourse)}
        cta={t('continueCta')}
        colorClass="bg-blue-600 text-white hover:bg-blue-700"
        iconBgClass="bg-white/20 text-white"
      />
    );
  }

  if (weakSkill) {
    return (
      <NextBestCard
        icon={<Dumbbell className="h-5 w-5" />}
        title={t('practiceWeakSkill')}
        subtitle={weakSkill.skillCode}
        href={`/practice`}
        cta={t('practiceCta')}
        colorClass="bg-orange-500 text-white hover:bg-orange-600"
        iconBgClass="bg-white/20 text-white"
      />
    );
  }

  return (
    <NextBestCard
      icon={<ArrowRight className="h-5 w-5" />}
      title={t('browseCourses')}
      subtitle={t('browseCoursesDesc')}
      href="/courses"
      cta={t('browseCta')}
      colorClass="bg-muted text-foreground hover:bg-muted/80 border"
      iconBgClass="bg-background text-foreground"
    />
  );
}

function NextBestCard({
  icon,
  title,
  subtitle,
  href,
  cta,
  colorClass,
  iconBgClass,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href: string;
  cta: string;
  colorClass: string;
  iconBgClass: string;
}) {
  const tGlobal = useTranslations('Student.srs.nextBestItem');
  return (
    <section className="rounded-md border p-5 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-md ${iconBgClass} ${colorClass.includes('bg-muted') ? 'bg-primary/10 text-primary' : ''}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            {tGlobal('title')}
          </p>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Link
        href={href}
        className={`inline-flex h-10 items-center justify-center rounded-md px-6 text-sm font-semibold transition-colors w-full sm:w-auto ${colorClass}`}
      >
        {cta}
      </Link>
    </section>
  );
}
