'use client';

import { Link } from '../../navigation';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileCheck2,
  Flame,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '../../features/auth/auth.store';
import { StudentNav } from '../../components/layout/student-nav';
import { useProgressSummary } from '../../hooks/use-progress';
import { getCourseProgressHref } from '../../lib/course-progress-utils';
import { NextBestItem } from '../../components/dashboard/next-best-item';
import { SrsReviewCard } from '../../components/dashboard/srs-review-card';

// Lazy load heavy dashboard widgets — these pull in large deps (recharts ~400KB, etc.)
const ActivityCalendar = dynamic(
  () =>
    import('../../components/dashboard/activity-calendar').then((mod) => ({
      default: mod.ActivityCalendar,
    })),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
    ssr: false,
  },
);

const PerformanceReport = dynamic(
  () =>
    import('../../components/dashboard/performance-report').then((mod) => ({
      default: mod.PerformanceReport,
    })),
  {
    loading: () => (
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
        <div className="h-64 rounded-2xl bg-card animate-pulse border border-border/50" />
      </div>
    ),
    ssr: false,
  },
);

const CourseProgressPlanner = dynamic(
  () =>
    import('../../components/dashboard/course-progress-planner').then((mod) => ({
      default: mod.CourseProgressPlanner,
    })),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
  },
);

const RecentLearningWork = dynamic(
  () =>
    import('../../components/dashboard/recent-learning-work').then((mod) => ({
      default: mod.RecentLearningWork,
    })),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
  },
);

const SkillMasteryPanel = dynamic(
  () =>
    import('../../components/dashboard/skill-mastery-panel').then((mod) => ({
      default: mod.SkillMasteryPanel,
    })),
  {
    loading: () => (
      <div className="h-48 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
  },
);

const SkillMasteryTrendPanel = dynamic(
  () =>
    import('../../components/dashboard/skill-mastery-trend-panel').then((mod) => ({
      default: mod.SkillMasteryTrendPanel,
    })),
  {
    loading: () => (
      <div className="h-80 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
    ssr: false,
  },
);

const CourseComparisonChart = dynamic(
  () =>
    import('../../components/dashboard/course-comparison-chart').then((mod) => ({
      default: mod.CourseComparisonChart,
    })),
  {
    loading: () => (
      <div className="h-80 rounded-2xl bg-card animate-pulse border border-border/50" />
    ),
    ssr: false,
  },
);

export default function LearningDashboard() {
  const locale = useLocale();
  const t = useTranslations('Student');
  const { isAuthenticated } = useAuthStore();
  const { data: summary, isLoading } = useProgressSummary();
  const activeCourse = summary?.activeCourse;
  const courses =
    summary?.courses && summary.courses.length > 0
      ? summary.courses
      : activeCourse
        ? [activeCourse]
        : [];
  const featuredCourse = activeCourse ?? courses[0] ?? null;
  const totals = summary?.totals;
  const featuredLesson = featuredCourse?.continueLesson ?? featuredCourse?.lastAccessedLesson;
  const formattedLastActivity = featuredCourse?.lastActivityAt
    ? new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(featuredCourse.lastActivityAt))
    : null;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{t('dashboard.badge')}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            {t('dashboard.allCourses')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('dashboard.loading')}
          </div>
        ) : courses.length === 0 ? (
          <section className="rounded-md border p-6">
            <h2 className="text-lg font-semibold">{t('dashboard.emptyTitle')}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t('dashboard.emptyDesc')}</p>
            <Link
              href="/courses"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t('dashboard.browseCourses')}
            </Link>
          </section>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
            <div className="space-y-8">
              <NextBestItem />
              <SrsReviewCard />
              {featuredCourse && (
                <section className="rounded-md border p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {activeCourse
                          ? t('dashboard.continueLearning')
                          : t('dashboard.startRecommended')}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">{featuredCourse.course.title}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {featuredLesson?.title ?? t('dashboard.startRecommendedDesc')}
                      </p>
                    </div>
                    <div className="rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                      {featuredCourse.completionPercentage}%
                    </div>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${featuredCourse.completionPercentage}%` }}
                    />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      {t('dashboard.completedCount', {
                        completed: featuredCourse.completedLessons,
                        total: featuredCourse.totalLessons,
                      })}
                    </span>
                    {featuredCourse.activitySessions > 0 && (
                      <span>
                        {t('dashboard.sessionValue', { count: featuredCourse.activitySessions })}
                      </span>
                    )}
                    {featuredLesson && (
                      <span>{t('dashboard.duration', { minutes: featuredLesson.duration })}</span>
                    )}
                  </div>

                  <div className="mt-5 rounded-md border border-dashed bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {featuredLesson ? t('dashboard.nextLesson') : t('dashboard.viewCoursePlan')}
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {featuredLesson?.title ?? t('dashboard.noNextLesson')}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('dashboard.lastActivityAt', {
                        value: formattedLastActivity ?? t('dashboard.lastActivityNone'),
                      })}
                    </p>
                  </div>

                  <Link
                    href={getCourseProgressHref(featuredCourse)}
                    className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  >
                    <PlayCircle className="h-4 w-4" />
                    {activeCourse ? t('dashboard.resume') : t('dashboard.startCourse')}
                  </Link>
                </section>
              )}

              <CourseProgressPlanner courses={courses} />
            </div>

            <aside className="space-y-6">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <DashboardStat
                  icon={BookOpen}
                  label={t('dashboard.enrolledCourses')}
                  value={totals?.courses ?? 0}
                />
                <DashboardStat
                  icon={CheckCircle2}
                  label={t('dashboard.completedLessons')}
                  value={totals?.completedLessons ?? 0}
                />
                <DashboardStat
                  icon={Clock3}
                  label={t('dashboard.studySessions')}
                  value={t('dashboard.sessionValue', { count: totals?.activitySessions ?? 0 })}
                />
                <DashboardStat
                  icon={BarChart3}
                  label={t('dashboard.overallProgress')}
                  value={`${totals?.completionPercentage ?? 0}%`}
                />
                <DashboardStat
                  icon={Flame}
                  label={t('dashboard.currentStreak')}
                  value={t('dashboard.streakValue', { days: totals?.currentStreak ?? 0 })}
                />
              </section>

              <section className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold">{t('dashboard.quickActions')}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('dashboard.quickActionsDesc')}
                  </p>
                </div>
                <QuickActionLink
                  href="/practice"
                  icon={Dumbbell}
                  title={t('dashboard.practiceAction')}
                  desc={t('dashboard.practiceActionDesc')}
                />
                <QuickActionLink
                  href="/exams"
                  icon={FileCheck2}
                  title={t('dashboard.examAction')}
                  desc={t('dashboard.examActionDesc')}
                />
                <QuickActionLink
                  href="/courses"
                  icon={BookOpen}
                  title={t('dashboard.coursesAction')}
                  desc={t('dashboard.coursesActionDesc')}
                />
              </section>
            </aside>
          </div>
        )}

        {!isLoading && courses.length > 0 && <RecentLearningWork />}

        {!isLoading && courses.length > 0 ? (
          <div className="mt-8">
            <CourseComparisonChart />
          </div>
        ) : null}

        {!isLoading && courses.length > 0 ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <SkillMasteryPanel locale={locale} />
            <SkillMasteryTrendPanel locale={locale} />
          </div>
        ) : null}

        <div className="mt-12">
          <PerformanceReport />
        </div>

        {summary?.activityCalendar && summary.activityCalendar.length > 0 && (
          <ActivityCalendar activityCalendar={summary.activityCalendar} />
        )}
      </main>
    </div>
  );
}

function QuickActionLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-md border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function DashboardStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-md border p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
