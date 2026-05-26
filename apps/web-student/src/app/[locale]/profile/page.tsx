'use client';

import { useProfileStats } from '../../../hooks/use-profile-stats';
import { StudentNav } from '../../../components/layout/student-nav';
import {
  Clock,
  Flame,
  Trophy,
  BookOpen,
  Activity,
  Loader2,
  User as UserIcon,
  Mail,
  Edit3,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@repo/ui';
import { useAuthStore } from '../../../features/auth/auth.store';
import { Link } from '../../../navigation';
import { useTranslations } from 'next-intl';

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function ProfilePage() {
  const { isAuthenticated, isInitialized, user } = useAuthStore();
  const authT = useTranslations('Student.auth');
  const t = useTranslations('Student.profile');
  const { data: stats, isLoading } = useProfileStats(isInitialized && isAuthenticated);
  const profileInitial =
    user?.fullName?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    t('defaultName').charAt(0).toUpperCase();

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto flex max-w-lg items-center justify-center px-6 py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-lg px-6 py-24">
          <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
            <p className="mt-4 text-muted-foreground">{t('loginPrompt')}</p>
            <Link
              href="/login?next=/profile"
              className="mt-8 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary font-medium text-primary-foreground transition-all hover:bg-primary/90"
            >
              {authT('loginButton')}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentNav showLinks />
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid gap-10">
            {/* User Profile Card */}
            <section className="rounded-xl border bg-card p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
              <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center mt-12">
                <div className="w-24 h-24 rounded-full border-4 border-card bg-primary/10 text-primary flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={t('avatarAlt')}
                      width={96}
                      height={96}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold">{profileInitial}</span>
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <h2 className="text-2xl font-bold tracking-tight">
                    {user?.fullName || t('defaultName')}
                  </h2>
                  <div className="flex items-center text-muted-foreground gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                </div>
                <div className="shrink-0 flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <Link href="/settings" className="w-full md:w-auto">
                    <Button className="w-full md:w-auto shadow-sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      {t('editProfile')}
                    </Button>
                  </Link>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-full">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">{t('currentStreak')}</div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-500 rounded-full">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.longestStreak}</div>
                  <div className="text-sm text-muted-foreground">{t('longestStreak')}</div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-500 rounded-full">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">
                    {formatDuration(stats.totalTimeLearnedSeconds)}
                  </div>
                  <div className="text-sm text-muted-foreground">{t('timeLearned')}</div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-500 rounded-full">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.completedLessons}</div>
                  <div className="text-sm text-muted-foreground">{t('lessonsCompleted')}</div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">{t('recentActivity')}</h2>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                {stats.recentActivities.length > 0 ? (
                  <div className="space-y-6 border-l-2 border-border ml-3 pl-6">
                    {stats.recentActivities.map((activity) => (
                      <div key={activity.id} className="relative">
                        <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                        <div className="text-sm font-medium">
                          {activity.type === 'LESSON_COMPLETED' ? 'Completed' : 'Viewed'}{' '}
                          <span className="text-primary">{activity.lessonTitle}</span>
                        </div>
                        {activity.courseTitle && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Course: {activity.courseTitle}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {timeAgo(activity.occurredAt)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {t('noActivity')}
                  </p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
