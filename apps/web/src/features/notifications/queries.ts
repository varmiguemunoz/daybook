import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { Notification } from '@gr8r/domain';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.notifications(unreadOnly),
    queryFn: () => apiFetch<Notification[]>(`/api/notifications${unreadOnly ? '?unread=true' : ''}`),
  });
}

export function useMarkNotificationRead(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllNotificationsRead() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<{ updated: number }>('/api/notifications/read-all', { method: 'POST' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
