import { useQuery } from '@tanstack/react-query';
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
