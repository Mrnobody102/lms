'use client';

import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Button, Badge } from '@/components/ui';
import { Users, BookOpen, TrendingUp, DollarSign } from 'lucide-react';

const stats = [
  {
    labelKey: 'revenue',
    value: '128.5M đ',
    trend: '+12.5%',
    icon: DollarSign,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900',
  },
  {
    labelKey: 'newStudents',
    value: '24',
    trend: '+4.3%',
    icon: Users,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900',
  },
  {
    labelKey: 'activeCourses',
    value: '12',
    trend: '0%',
    icon: BookOpen,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    labelKey: 'completionRate',
    value: '86%',
    trend: '+2.1%',
    icon: TrendingUp,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900',
  },
];

export default function AdminHome() {
  const t = useTranslations('Admin');

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('dashboard')}
              description={t('welcome')}
              showCreateCourse={true}
            />

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="bg-card border rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                    <Badge
                      variant={stat.trend.startsWith('+') ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{t(stat.labelKey)}</div>
                </div>
              ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Registrations */}
              <div className="lg:col-span-2 bg-card border rounded-xl p-5">
                <h2 className="text-base font-semibold mb-4">{t('recentRegistrations')}</h2>
                <div className="divide-y divide-border">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {String.fromCharCode(64 + i)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            Nguyen Van {String.fromCharCode(64 + i)}
                          </p>
                          <p className="text-xs text-muted-foreground">nguyenvan{i}@gmail.com</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-primary">HSK 3 - Basic</p>
                        <p className="text-[11px] text-muted-foreground">
                          {i * 2} {t('minutesAgo')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card border rounded-xl p-5 flex flex-col gap-4">
                <h2 className="text-base font-semibold">{t('quickActions')}</h2>
                <Button variant="outline" className="justify-between h-auto py-3 px-4">
                  <span className="text-sm">{t('approveStudents')}</span>
                  <Badge variant="destructive" className="text-[10px] ml-2 shrink-0">
                    3
                  </Badge>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4">
                  <span className="text-sm">{t('sendNotification')}</span>
                </Button>
                <Button variant="outline" className="justify-start h-auto py-3 px-4">
                  <span className="text-sm">{t('exportRevenue')}</span>
                </Button>

                {/* Storage */}
                <div className="mt-auto pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t('storageUsed')}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      {t('storageExceeded')}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-amber-400 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
