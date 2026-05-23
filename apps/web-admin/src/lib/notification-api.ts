import api from './api';

export interface BroadcastNotificationDto {
  title: string;
  content?: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  actionUrl?: string;
}

export const adminNotificationApi = {
  broadcast: async (data: BroadcastNotificationDto) => {
    const res = await api.post('/admin/notifications/broadcast', data);
    return res.data;
  },
};
