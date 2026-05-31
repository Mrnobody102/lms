import api from './api';

export interface BroadcastNotificationDto {
  title: string;
  content?: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  actionUrl?: string;
}

export function buildNotificationStreamUrl() {
  const streamUrl = process.env.NEXT_PUBLIC_NOTIFICATION_STREAM_URL?.trim().replace(/\/+$/, '');
  const baseUrl = streamUrl || '/api/notifications/stream';
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID?.trim();
  return tenantId ? `${baseUrl}?tenantId=${encodeURIComponent(tenantId)}` : baseUrl;
}

export const adminNotificationApi = {
  broadcast: async (data: BroadcastNotificationDto) => {
    const res = await api.post('/admin/notifications/broadcast', data);
    return res.data;
  },
};
