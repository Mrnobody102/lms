import api from './api';

export interface Notification {
  id: string;
  title: string;
  content: string | null;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  meta: {
    skip: number;
    take: number;
    total: number;
    hasMore: boolean;
  };
}

export type NotificationStreamEvent =
  | { kind: 'notifications.snapshot'; unreadCount: number }
  | { kind: 'notification.created'; notification: Notification; unreadCount: number }
  | { kind: 'notifications.refresh'; unreadCount?: number };

export const notificationApi = {
  getNotifications: async (skip = 0, take = 20): Promise<GetNotificationsResponse> => {
    const res = await api.get('/notifications', { params: { skip, take } });
    const raw = res.data as unknown;
    if (isNotificationsResponse(raw)) {
      return raw;
    }

    const fallbackNotifications =
      isRecord(raw) && Array.isArray(raw.notifications)
        ? (raw.notifications as Notification[])
        : [];
    const fallbackUnreadCount =
      isRecord(raw) && typeof raw.unreadCount === 'number' ? raw.unreadCount : 0;

    return {
      notifications: fallbackNotifications,
      unreadCount: fallbackUnreadCount,
      meta: {
        skip,
        take,
        total: fallbackNotifications.length,
        hasMore: false,
      },
    };
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },

  subscribeToStream: (onEvent: (event: NotificationStreamEvent) => void): (() => void) => {
    if (typeof window === 'undefined') {
      return () => undefined;
    }

    const eventSource = new EventSource(buildNotificationStreamUrl(), { withCredentials: true });
    eventSource.onmessage = (message) => {
      const event = parseNotificationStreamEvent(message.data);
      if (event) {
        onEvent(event);
      }
    };

    return () => eventSource.close();
  },
};

function buildNotificationStreamUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const baseUrl = apiUrl ? `${apiUrl}/api/notifications/stream` : '/api/notifications/stream';
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID?.trim();
  return tenantId ? `${baseUrl}?tenantId=${encodeURIComponent(tenantId)}` : baseUrl;
}

function parseNotificationStreamEvent(value: string): NotificationStreamEvent | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (record.kind === 'notifications.snapshot' && typeof record.unreadCount === 'number') {
      return { kind: record.kind, unreadCount: record.unreadCount };
    }
    if (record.kind === 'notifications.refresh') {
      return {
        kind: record.kind,
        unreadCount: typeof record.unreadCount === 'number' ? record.unreadCount : undefined,
      };
    }
    if (
      record.kind === 'notification.created' &&
      typeof record.unreadCount === 'number' &&
      isNotification(record.notification)
    ) {
      return {
        kind: record.kind,
        notification: record.notification,
        unreadCount: record.unreadCount,
      };
    }
  } catch {
    return null;
  }

  return null;
}

function isNotification(value: unknown): value is Notification {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.type === 'string' &&
    typeof value.createdAt === 'string'
  );
}

function isNotificationsResponse(value: unknown): value is GetNotificationsResponse {
  if (!isRecord(value)) {
    return false;
  }

  const meta = value.meta;
  return (
    Array.isArray(value.notifications) &&
    typeof value.unreadCount === 'number' &&
    !!meta &&
    typeof meta === 'object' &&
    typeof (meta as Record<string, unknown>).skip === 'number' &&
    typeof (meta as Record<string, unknown>).take === 'number' &&
    typeof (meta as Record<string, unknown>).total === 'number' &&
    typeof (meta as Record<string, unknown>).hasMore === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}
