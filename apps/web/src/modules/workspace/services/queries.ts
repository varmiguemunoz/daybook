import { useQuery } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../core/services/api-client';
import type { Activity, Member, Workspace } from '@daybook/domain';

export interface Bootstrap {
  workspace: Workspace;
  me: Member;
  members: Member[];
  activity: Activity[];
}

export function useBootstrap() {
  return useQuery({
    queryKey: queryKeys.bootstrap,
    queryFn: () => apiFetch<Bootstrap>('/api/bootstrap'),
  });
}
