import { useMutation } from '@tanstack/react-query';
import { adminNotificationApi, BroadcastNotificationDto } from '../lib/notification-api';

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: (data: BroadcastNotificationDto) => adminNotificationApi.broadcast(data),
  });
}
