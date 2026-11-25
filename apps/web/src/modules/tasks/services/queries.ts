import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BulkTaskPatch, CreateTaskPayload, Task, UpdateTaskInput } from '@daybook/domain';
import { queryKeys, apiFetch } from '../../core/services/api-client';
import { showToast } from '../../core/components/Toast';

type Snapshot = { previous?: Task[] };

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks,
    queryFn: () => apiFetch<Task[]>('/api/tasks'),
  });
}

function useOptimisticTasks<Variables>(
  mutationFn: (variables: Variables) => Promise<unknown>,
  apply: (tasks: Task[], variables: Variables) => Task[],
  failure: string,
) {
  const client = useQueryClient();

  return useMutation<unknown, Error, Variables, Snapshot>({
    mutationKey: queryKeys.tasks,
    mutationFn,
    onMutate: async variables => {
      await client.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = client.getQueryData<Task[]>(queryKeys.tasks);
      client.setQueryData<Task[]>(queryKeys.tasks, current => apply(current ?? [], variables));
      return { previous };
    },
    onError: (_error, _variables, snapshot) => {
      client.setQueryData(queryKeys.tasks, snapshot?.previous);
      showToast(failure, 'error');
    },
    // Refetch only after the last overlapping task mutation so an earlier response cannot overwrite a newer optimistic change.
    onSettled: () => {
      if (client.isMutating({ mutationKey: queryKeys.tasks }) > 1) return;
      return Promise.all([client.invalidateQueries({ queryKey: queryKeys.tasks }), client.invalidateQueries({ queryKey: queryKeys.bootstrap })]);
    },
  });
}

export function useCreateTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskPayload) => apiFetch<Task>('/api/tasks', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: queryKeys.tasks }), client.invalidateQueries({ queryKey: queryKeys.bootstrap })]),
  });
}

export function useUpdateTask() {
  return useOptimisticTasks(
    ({ id, patch }: { id: string; patch: UpdateTaskInput }) => apiFetch<Task>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    (tasks, { id, patch }) => tasks.map(task => (task.id === id ? { ...task, ...patch } : task)),
    'Could not update the task',
  );
}

export function useUpdateTasks() {
  return useOptimisticTasks(
    ({ ids, patch }: { ids: string[]; patch: BulkTaskPatch }) => apiFetch<Task[]>('/api/tasks', { method: 'PATCH', body: JSON.stringify({ ids, patch }) }),
    (tasks, { ids, patch }) => tasks.map(task => (ids.includes(task.id) ? { ...task, ...patch } : task)),
    'Could not update the selected tasks',
  );
}

export function useDeleteTasks() {
  return useOptimisticTasks(
    (ids: string[]) => apiFetch<{ deleted: number }>('/api/tasks', { method: 'DELETE', body: JSON.stringify({ ids }) }),
    (tasks, ids) => tasks.filter(task => !ids.includes(task.id)),
    'Could not delete the tasks',
  );
}
