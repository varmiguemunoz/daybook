import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { CalendarEvent } from '@gr8r/domain';

export function useEvents(range?: { from?: string; to?: string }) {
  const qs = range ? `?${new URLSearchParams(range as Record<string, string>).toString()}` : '';
  return useQuery({ queryKey: queryKeys.events(range), queryFn: () => apiFetch<CalendarEvent[]>(`/api/events${qs}`) });
}

export function useCreateEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CalendarEvent, 'id' | 'workspaceId' | 'createdAt' | 'createdBy'>) =>
      apiFetch<CalendarEvent>('/api/events', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events() }),
  });
}

export function useUpdateEvent(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CalendarEvent>) => apiFetch<CalendarEvent>(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events() }),
  });
}

export function useDeleteEvent(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.events() }),
  });
}
