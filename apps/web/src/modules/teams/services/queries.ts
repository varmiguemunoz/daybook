import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateTeamInput, Team, UpdateTeamInput } from '@daybook/domain';
import { queryKeys, apiFetch } from '../../core/services/api-client';

export function useTeams() {
  return useQuery({ queryKey: queryKeys.teams, queryFn: () => apiFetch<Team[]>('/api/teams') });
}

function useTeamMutation<Variables>(mutationFn: (variables: Variables) => Promise<unknown>) {
  const client = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.teams }) });
}

export function useCreateTeam() {
  return useTeamMutation((input: CreateTeamInput) => apiFetch<Team>('/api/teams', { method: 'POST', body: JSON.stringify(input) }));
}

export function useUpdateTeam() {
  return useTeamMutation(({ id, patch }: { id: string; patch: UpdateTeamInput }) =>
    apiFetch<Team>(`/api/teams/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  );
}

export function useDeleteTeam() {
  return useTeamMutation((id: string) => apiFetch<void>(`/api/teams/${id}`, { method: 'DELETE' }));
}

export function useAddTeamMember() {
  return useTeamMutation(({ teamId, memberId }: { teamId: string; memberId: string }) =>
    apiFetch<Team>(`/api/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ memberId }) }),
  );
}

export function useRemoveTeamMember() {
  return useTeamMutation(({ teamId, memberId }: { teamId: string; memberId: string }) =>
    apiFetch<Team>(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
  );
}
