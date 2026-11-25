import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { SavedView } from '@gr8r/domain';

export function useViews(ownerId?: string) {
  return useQuery({ queryKey: queryKeys.views(ownerId), queryFn: () => apiFetch<SavedView[]>(`/api/views${ownerId ? `?ownerId=${ownerId}` : ''}`) });
}

export function useCreateView() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<SavedView, 'id' | 'workspaceId' | 'ownerId' | 'createdAt' | 'updatedAt'>) =>
      apiFetch<SavedView>('/api/views', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['views'] }),
  });
}

export function useUpdateView(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<SavedView>) => apiFetch<SavedView>(`/api/views/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['views'] }),
  });
}

export function useDeleteView(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/views/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['views'] }),
  });
}
