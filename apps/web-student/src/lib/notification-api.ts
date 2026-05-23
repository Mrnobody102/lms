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
}

export const notificationApi = {
  getNotifications: async (skip = 0, take = 20): Promise<GetNotificationsResponse> => {
    const res = await api.get('/notifications', { params: { skip, take } });
    return res.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
