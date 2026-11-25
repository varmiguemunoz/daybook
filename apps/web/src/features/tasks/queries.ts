import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { CreateTaskPayload, Task, UpdateTaskInput } from '@gr8r/domain';

export function useTasks(filters?: Record<string, string | string[]>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (Array.isArray(value)) value.forEach(item => search.append(key, item));
    else if (value) search.set(key, value);
  }
  const qs = search.toString();

  return useQuery({
    queryKey: queryKeys.tasks(filters as Record<string, unknown>),
    queryFn: () => apiFetch<Task[]>(`/api/tasks${qs ? `?${qs}` : ''}`),
  });
}

export function useCreateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskPayload) => apiFetch<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks() }),
  });
}

export function useUpdateTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTaskInput) => apiFetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks() }),
  });
}

export function useDeleteTask(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.tasks() }),
  });
}
