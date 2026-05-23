'use client';

import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Button,
} from '@repo/ui';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../../hooks/use-notifications';
import { Notification } from '../../../lib/notification-api';
import { Link } from '@/navigation';

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const t = useTranslations('Student');
  const { data, isLoading } = useNotifications(0, 5);
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-lg">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <DropdownMenuLabel className="p-0 font-semibold">
            {t('nav.notifications') || 'Notifications'}
          </DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs font-medium text-primary"
              onClick={() => markAllAsRead.mutate()}
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n: Notification) => (
              <div
                key={n.id}
                className={`relative flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 ${
                  !n.readAt ? 'bg-primary/5' : ''
                }`}
              >
                {!n.readAt && (
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                <div className="flex-1 space-y-1 pl-1">
                  <p className="text-sm font-medium leading-none">
                    {n.actionUrl ? (
                      <Link
                        href={n.actionUrl}
                        className="hover:underline"
                        onClick={() => !n.readAt && markAsRead.mutate(n.id)}
                      >
                        {n.title}
                      </Link>
                    ) : (
                      <span>{n.title}</span>
                    )}
                  </p>
                  {n.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.readAt && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                    onClick={() => markAsRead.mutate(n.id)}
                    title="Mark as read"
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
