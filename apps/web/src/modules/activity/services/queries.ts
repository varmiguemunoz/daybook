import { useQuery } from '@tanstack/react-query';
import { apiFetch, queryKeys } from '../../core/services/api-client';
import type { Activity } from '@daybook/domain';

export function useActivity(limit = 20) {
  return useQuery({
    queryKey: queryKeys.activity(limit),
    queryFn: () => apiFetch<Activity[]>(`/api/activity?limit=${limit}`),
  });
}
