import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Dumbbell,
  FileCheck2,
  History,
  Target,
  AlertTriangle,
  Flame,
  RefreshCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { StudentNav } from '../../components/layout/student-nav';
import type {
  StudentTodayResponse,
  TodayFeedbackItem,
  TodayTask,
  TodayTaskType,
} from '../../lib/student-api';
import { Link } from '../../navigation';

type StudentTranslator = ReturnType<typeof useTranslations>;

export default function LearningDashboard({ data }: { data: StudentTodayResponse | null }) {
  const t = useTranslations('Student');
  const locale = useLocale();

  if (!data) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="rounded-md border border-destructive/20 bg-destructive/5 p-5 text-sm text-destructive">
            {t('dashboard.todayLoadError')}
          </section>
        </main>
      </div>
    );
  }

  const tasks = data.tasks ?? [];
  const courses = data.courses ?? [];
  const recentFeedback = [
    ...(data?.recentFeedback.practice ?? []).map((item) => ({
      ...item,
      kind: 'practice' as const,
    })),
    ...(data?.recentFeedback.exams ?? []).map((item) => ({ ...item, kind: 'exam' as const })),
  ]
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">{t('dashboard.todayBadge')}</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">{t('dashboard.todayTitle')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('dashboard.todaySubtitle')}
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
          >
            <BookOpen className="h-4 w-4" />
            {t('dashboard.allCourses')}
          </Link>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <PrimaryTaskCard task={data.primaryTask} />

            <section className="rounded-md border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <IconFrame icon={Target} />
                <div>
                  <h2 className="text-lg font-semibold">{t('dashboard.todayQueueTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('dashboard.todayQueueDesc')}</p>
                </div>
              </div>
              <div className="space-y-3">
                {tasks.map((task) => (
                  <TaskRow key={task.id} task={task} locale={locale} />
                ))}
              </div>
            </section>

            <section className="rounded-md border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <IconFrame icon={History} />
                <div>
                  <h2 className="text-lg font-semibold">{t('dashboard.feedbackTitle')}</h2>
                  <p className="text-sm text-muted-foreground">{t('dashboard.feedbackDesc')}</p>
                </div>
              </div>
              {recentFeedback.length === 0 ? (
                <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {t('dashboard.feedbackEmpty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentFeedback.map((item) => (
                    <FeedbackRow key={`${item.kind}-${item.id}`} item={item} locale={locale} />
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-md border bg-card p-5">
              <h2 className="text-lg font-semibold">{t('dashboard.courseSnapshotTitle')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('dashboard.courseSnapshotDesc')}
              </p>
              {courses.length === 0 ? (
                <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                  {t('dashboard.emptyDesc')}
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <CourseSnapshot key={course.course.id} course={course} />
                  ))}
                </div>
              )}
            </section>

            <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricTile
                icon={RefreshCcw}
                label={t('dashboard.reviewDue')}
                value={data.srsDue.dueNow}
              />
              <MetricTile
                icon={BookOpen}
                label={t('dashboard.enrolledCourses')}
                value={courses.length}
              />
              <MetricTile
                icon={CheckCircle2}
                label={t('dashboard.completedLessons')}
                value={courses.reduce((sum, course) => sum + course.completedLessons, 0)}
              />
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PrimaryTaskCard({ task }: { task: TodayTask }) {
  const t = useTranslations('Student');

  return (
    <section className="rounded-md border bg-primary p-5 text-primary-foreground">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-foreground/15">
            {renderTaskIcon(task.type, 'h-6 w-6')}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-primary-foreground/80">
              {t('dashboard.primaryTask')}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-2xl font-bold tracking-tight">{getTaskTitle(task, t)}</h2>
              {task.meta.isUrgent && (
                <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-100 border border-red-500/30">
                  <Flame className="h-3 w-3" /> Urgent
                </span>
              )}
              {task.meta.isCriticallyWeak && (
                <span className="flex items-center gap-1 rounded-full bg-orange-500/20 px-2 py-0.5 text-xs font-semibold text-orange-100 border border-orange-500/30">
                  <AlertTriangle className="h-3 w-3" /> Critical Weakness
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-primary-foreground/80">{getTaskSubtitle(task, t)}</p>
          </div>
        </div>
        <Link
          href={task.href}
          className="inline-flex h-12 min-w-[8rem] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-background px-5 text-sm font-semibold text-foreground hover:bg-background/90"
        >
          {getTaskCta(task.type, t)}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function TaskRow({ task, locale }: { task: TodayTask; locale: string }) {
  const t = useTranslations('Student');

  return (
    <article className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <TaskIconFrame type={task.type} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{getTaskTitle(task, t)}</h3>
            {task.meta.isUrgent && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                <Flame className="h-3 w-3" /> Urgent
              </span>
            )}
            {task.meta.isCriticallyWeak && (
              <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                <AlertTriangle className="h-3 w-3" /> Critical
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{getTaskSubtitle(task, t)}</p>
          {task.dueAt ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('dashboard.taskDueAt', { value: formatDateTime(task.dueAt, locale) })}
            </p>
          ) : null}
        </div>
      </div>
      <Link
        href={task.href}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
      >
        {getTaskCta(task.type, t)}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function FeedbackRow({
  item,
  locale,
}: {
  item: TodayFeedbackItem & { kind: 'practice' | 'exam' };
  locale: string;
}) {
  const t = useTranslations('Student');
  const Icon = item.kind === 'practice' ? Dumbbell : FileCheck2;

  return (
    <article className="flex flex-col gap-3 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <IconFrame icon={Icon} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">{item.title}</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {item.percentage}%
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.courseTitle ?? t('dashboard.courseFallback')}
            {item.unitTitle ? ` / ${item.unitTitle}` : ''}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('dashboard.feedbackSubmittedAt', {
              value: formatDateTime(item.submittedAt, locale),
            })}
          </p>
        </div>
      </div>
      <Link
        href={item.href}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
      >
        {t('dashboard.reviewFeedback')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function CourseSnapshot({
  course,
}: {
  course: {
    course: { id: string; title: string };
    totalLessons: number;
    completedLessons: number;
    completionPercentage: number;
    continueLesson: { id: string; title: string } | null;
  };
}) {
  const t = useTranslations('Student');

  return (
    <article className="rounded-md border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{course.course.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('dashboard.completedCount', {
              completed: course.completedLessons,
              total: course.totalLessons,
            })}
          </p>
        </div>
        <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {course.completionPercentage}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${course.completionPercentage}%` }}
        />
      </div>
      <Link
        href={
          course.continueLesson
            ? `/lessons/${course.continueLesson.id}`
            : `/courses/${course.course.id}`
        }
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium hover:bg-muted"
      >
        {course.continueLesson ? t('dashboard.resume') : t('dashboard.viewCoursePlan')}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <article className="rounded-md border bg-card p-4">
      <IconFrame icon={Icon} />
      <p className="mt-3 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </article>
  );
}

function IconFrame({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Icon className="h-5 w-5" />
    </span>
  );
}

function TaskIconFrame({ type }: { type: TodayTaskType }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      {renderTaskIcon(type, 'h-5 w-5')}
    </span>
  );
}

function renderTaskIcon(type: TodayTaskType, className: string) {
  switch (type) {
    case 'ACTIVE_EXAM':
      return <FileCheck2 className={className} />;
    case 'REVIEW_DUE':
      return <RefreshCcw className={className} />;
    case 'CONTINUE_COURSE':
      return <BookOpen className={className} />;
    case 'WEAK_SKILL_PRACTICE':
      return <Dumbbell className={className} />;
    case 'BROWSE_COURSES':
      return <Target className={className} />;
  }
}

function getTaskTitle(task: TodayTask, t: StudentTranslator) {
  switch (task.type) {
    case 'ACTIVE_EXAM':
      return t('dashboard.task.activeExamTitle', { title: task.title });
    case 'REVIEW_DUE':
      return t('dashboard.task.reviewDueTitle', { count: getNumberMeta(task, 'dueNow') });
    case 'CONTINUE_COURSE':
      return t('dashboard.task.continueCourseTitle', { title: task.title });
    case 'WEAK_SKILL_PRACTICE':
      return t('dashboard.task.weakSkillTitle', { skill: task.title });
    case 'BROWSE_COURSES':
      return t('dashboard.task.browseTitle');
  }
}

function getTaskSubtitle(task: TodayTask, t: StudentTranslator) {
  switch (task.type) {
    case 'ACTIVE_EXAM':
      return t('dashboard.task.activeExamSubtitle', { course: task.subtitle });
    case 'REVIEW_DUE':
      return t('dashboard.task.reviewDueSubtitle');
    case 'CONTINUE_COURSE':
      return t('dashboard.task.continueCourseSubtitle', { course: task.subtitle });
    case 'WEAK_SKILL_PRACTICE':
      return t('dashboard.task.weakSkillSubtitle', {
        mastery: getNumberMeta(task, 'mastery'),
      });
    case 'BROWSE_COURSES':
      return t('dashboard.task.browseSubtitle');
  }
}

function getTaskCta(type: TodayTaskType, t: StudentTranslator) {
  switch (type) {
    case 'ACTIVE_EXAM':
      return t('dashboard.task.activeExamCta');
    case 'REVIEW_DUE':
      return t('dashboard.task.reviewDueCta');
    case 'CONTINUE_COURSE':
      return t('dashboard.task.continueCourseCta');
    case 'WEAK_SKILL_PRACTICE':
      return t('dashboard.task.weakSkillCta');
    case 'BROWSE_COURSES':
      return t('dashboard.task.browseCta');
  }
}

function getNumberMeta(task: TodayTask, key: string) {
  const value = task.meta[key];
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function formatDateTime(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
