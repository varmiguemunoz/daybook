import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../shared/api/client';
import type { Activity } from '@gr8r/domain';

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: ['activity', limit],
    queryFn: () => apiFetch<Activity[]>(`/api/activity?limit=${limit}`),
  });
}
