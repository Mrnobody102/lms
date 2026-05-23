import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../lib/notification-api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (skip: number, take: number) => [...notificationKeys.all, 'list', skip, take] as const,
};

export function useNotifications(skip = 0, take = 20, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(skip, take),
    queryFn: () => notificationApi.getNotifications(skip, take),
    enabled,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
