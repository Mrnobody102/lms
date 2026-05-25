import api from './api';
import { DEFAULT_DEMO_TENANT_ID } from '@repo/shared';

export interface BroadcastNotificationDto {
  title: string;
  content?: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS';
  actionUrl?: string;
}

export function buildNotificationStreamUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const baseUrl = apiUrl ? `${apiUrl}/api/notifications/stream` : '/api/notifications/stream';
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_DEMO_TENANT_ID;
  return `${baseUrl}?tenantId=${encodeURIComponent(tenantId)}`;
}

export const adminNotificationApi = {
  broadcast: async (data: BroadcastNotificationDto) => {
    const res = await api.post('/admin/notifications/broadcast', data);
    return res.data;
  },
};
