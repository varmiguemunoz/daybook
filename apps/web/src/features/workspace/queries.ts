import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { Activity, Member, Task, Workspace } from '@gr8r/domain';

export interface Bootstrap {
  workspace: Workspace;
  me: Member;
  members: Member[];
  tasks: Task[];
  activity: Activity[];
}

export function useBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: () => apiFetch<Bootstrap>('/api/bootstrap'),
  });
}

export function useUpdateWorkspace(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { name?: string; slug?: string; color?: string }) => apiFetch<Workspace>(`/api/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.bootstrap }),
  });
}
