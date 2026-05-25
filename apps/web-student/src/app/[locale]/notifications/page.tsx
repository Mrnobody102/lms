'use client';

import { Button } from '@repo/ui';
import { CheckCircle2, AlertTriangle, Info, Check, Loader2, Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/navigation';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { useAuthStore } from '@/features/auth/auth.store';

import { StudentNav } from '../../../components/layout/student-nav';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
} from '../../../hooks/use-notifications';
import { Notification } from '../../../lib/notification-api';

type NotificationsTranslator = ReturnType<typeof useTranslations<'Student.notifications'>>;

function getInternalActionUrl(actionUrl: string | null) {
  if (!actionUrl || !actionUrl.startsWith('/') || actionUrl.startsWith('//')) {
    return null;
  }

  return actionUrl;
}

function timeAgo(dateStr: string, t: NotificationsTranslator) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t('timeAgo.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('timeAgo.minutes', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('timeAgo.hours', { hours });
  const days = Math.floor(hours / 24);
  return t('timeAgo.days', { days });
}

const ITEMS_PER_PAGE = 20;

export default function NotificationsPage() {
  const t = useTranslations('Student.notifications');
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [page, setPage] = useState(0);

  const { data, isLoading } = useNotifications(
    page * ITEMS_PER_PAGE,
    ITEMS_PER_PAGE,
    isAuthenticated,
  );
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;
  const totalPages = Math.max(1, Math.ceil((data?.meta.total ?? 0) / ITEMS_PER_PAGE));
  const canGoNext = data?.meta.hasMore ?? false;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentNav showLinks />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/notifications" />
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-full">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{t('header.title')}</h1>
                  <p className="text-muted-foreground text-sm">
                    {t('header.unreadCount', { count: unreadCount })}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => markAllAsRead.mutate()}
                  disabled={markAllAsRead.isPending}
                >
                  {markAllAsRead.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t('header.markAllAsRead')}
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">{t('empty.title')}</h3>
                <p className="text-muted-foreground mt-1">{t('empty.description')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border bg-card overflow-hidden">
                  <div className="divide-y">
                    {notifications.map((n: Notification) => {
                      const actionUrl = getInternalActionUrl(n.actionUrl);

                      return (
                        <div
                          key={n.id}
                          className={`relative flex gap-4 p-5 transition-colors hover:bg-muted/30 sm:p-6 ${
                            !n.readAt ? 'bg-primary/5' : ''
                          }`}
                        >
                          {!n.readAt && (
                            <span className="absolute bottom-0 left-0 top-0 w-1 bg-primary" />
                          )}
                          <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p
                              className={`text-base font-medium ${!n.readAt ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {actionUrl ? (
                                <Link
                                  href={actionUrl}
                                  className="hover:text-primary hover:underline"
                                  onClick={() => !n.readAt && markAsRead.mutate(n.id)}
                                >
                                  {n.title}
                                </Link>
                              ) : (
                                <span>{n.title}</span>
                              )}
                            </p>
                            {n.content && (
                              <p
                                className={`text-sm ${!n.readAt ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}
                              >
                                {n.content}
                              </p>
                            )}
                            <p className="pt-2 text-xs font-medium text-muted-foreground/60">
                              {timeAgo(n.createdAt, t)}
                            </p>
                          </div>
                          {!n.readAt && (
                            <div className="shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 rounded-md hover:bg-background"
                                onClick={() => markAsRead.mutate(n.id)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                {t('read')}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center py-4">
                  <Button
                    variant="outline"
                    disabled={page === 0}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    {t('pagination.prev')}
                  </Button>
                  <span className="text-sm font-medium text-muted-foreground">
                    {t('pagination.page', { page: page + 1, total: totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!canGoNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('pagination.next')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
