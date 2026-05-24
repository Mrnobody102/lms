import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../lib/notification-api';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (skip: number, take: number) => [...notificationKeys.all, 'list', skip, take] as const,
};

export function useNotifications(skip = 0, take = 20, enabled = true) {
  useNotificationStream(enabled);

  return useQuery({
    queryKey: notificationKeys.list(skip, take),
    queryFn: () => notificationApi.getNotifications(skip, take),
    enabled,
    refetchInterval: enabled ? 30000 : false,
  });
}

export function useNotificationStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return notificationApi.subscribeToStream(() => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    });
  }, [enabled, queryClient]);
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
