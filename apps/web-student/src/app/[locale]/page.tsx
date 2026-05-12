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
  Trophy,
  User as UserIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '../../features/auth/auth.store';
import { StudentNav } from '../../components/layout/student-nav';
import { useProgressSummary } from '../../hooks/use-progress';
import { ActivityCalendar } from '../../components/dashboard/activity-calendar';
import { PerformanceReport } from '../../components/dashboard/performance-report';
import { CourseProgressPlanner } from '../../components/dashboard/course-progress-planner';
import { RecentLearningWork } from '../../components/dashboard/recent-learning-work';
import { getCourseProgressHref } from '../../lib/course-progress-utils';

export default function Home() {
  const t = useTranslations('Student');
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <LearningDashboard />;
  }

  return (
    <div className="min-h-screen font-sans">
      <StudentNav showLinks />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-32 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            {t('hero.badge')}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
            {t('hero.title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
              {t('hero.titleAlt')}
            </span>{' '}
            {t('hero.titleEnd')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
            {t('hero.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={isAuthenticated ? '/courses' : '/register'}
              className="px-10 py-5 bg-primary text-primary-foreground text-lg font-black rounded-2xl hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <PlayCircle className="w-6 h-6" />
              {t('hero.trial')}
            </Link>
            <Link
              href={isAuthenticated ? '/courses' : '/login'}
              className="px-10 py-5 bg-card text-foreground border border-border/50 text-lg font-black rounded-2xl hover:bg-muted hover:shadow-xl transition-all flex items-center justify-center active:scale-95"
            >
              {t('hero.roadmap')}
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary to-orange-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative aspect-video bg-slate-950 rounded-2xl shadow-2xl overflow-hidden border flex items-center justify-center group cursor-pointer">
            <div className="text-center">
              <PlayCircle className="w-20 h-20 text-white/80 group-hover:text-primary group-hover:scale-110 transition-all duration-300 mx-auto mb-4" />
              <p className="text-slate-300 font-bold">{t('hero.watchVideo')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-card/50 py-24 border-t border-b transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold mb-4">{t('features.whyUs')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto font-medium">
              {t('features.whyUsDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: t('features.items.hsk.title'),
                icon: Trophy,
                desc: t('features.items.hsk.desc'),
              },
              {
                title: t('features.items.library.title'),
                icon: BookOpen,
                desc: t('features.items.library.desc'),
              },
              {
                title: t('features.items.community.title'),
                icon: UserIcon,
                desc: t('features.items.community.desc'),
              },
            ].map((item, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-background rounded-xl shadow-sm border flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-all">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted text-muted-foreground py-12 border-t">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-medium">&copy; 2026 LMS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function LearningDashboard() {
  const locale = useLocale();
  const t = useTranslations('Student');
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
