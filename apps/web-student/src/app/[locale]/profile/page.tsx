'use client';

import { useProfileStats } from '../../../hooks/use-profile-stats';
import { StudentNav } from '../../../components/layout/student-nav';
import { Clock, Flame, Trophy, BookOpen, Activity, Loader2, User as UserIcon } from 'lucide-react';

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
  const { isAuthenticated } = useAuthStore();
  const authT = useTranslations('Student.auth');
  const { data: stats, isLoading } = useProfileStats();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <StudentNav showLinks />
        <main className="mx-auto max-w-lg px-6 py-24">
          <div className="rounded-xl border bg-card p-8 shadow-sm text-center">
            <div className="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Hồ sơ Học viên</h1>
            <p className="mt-4 text-muted-foreground">
              Vui lòng đăng nhập để xem hồ sơ và thống kê học tập.
            </p>
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
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground">
            View your learning statistics and recent activity.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stats ? (
          <div className="grid gap-10">
            {/* Stats Grid */}
            <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-full">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Current Streak</div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 text-blue-500 rounded-full">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.longestStreak}</div>
                  <div className="text-sm text-muted-foreground">Longest Streak</div>
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
                  <div className="text-sm text-muted-foreground">Time Learned</div>
                </div>
              </div>

              <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-center items-center text-center space-y-2">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-500 rounded-full">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-bold">{stats.completedLessons}</div>
                  <div className="text-sm text-muted-foreground">Lessons Completed</div>
                </div>
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b pb-2">
                <Activity className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Recent Activity</h2>
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
                    No recent activity found. Start learning to see your progress here!
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
