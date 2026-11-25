import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../core/services/api-client';
import type { Notification } from '@daybook/domain';

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.notifications(unreadOnly),
    queryFn: () => apiFetch<Notification[]>(`/api/notifications${unreadOnly ? '?unread=true' : ''}`),
  });
}

function useNotificationMutation<Variables>(mutationFn: (variables: Variables) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSettled: () => client.invalidateQueries({ queryKey: ['notifications'] }) });
}

export function useMarkNotificationRead() {
  return useNotificationMutation((id: string) => apiFetch<Notification>(`/api/notifications/${id}/read`, { method: 'PATCH' }));
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation(() => apiFetch<{ updated: number }>('/api/notifications/read-all', { method: 'POST' }));
}
