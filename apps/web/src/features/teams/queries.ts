import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { CreateTeamInput, Team, UpdateTeamInput } from '@gr8r/domain';

export function useTeams() {
  return useQuery({ queryKey: queryKeys.teams, queryFn: () => apiFetch<Team[]>('/api/teams') });
}

export function useCreateTeam() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTeamInput) => apiFetch<Team>('/api/teams', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.teams }); client.invalidateQueries({ queryKey: queryKeys.members }); },
  });
}

export function useUpdateTeam(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeamInput) => apiFetch<Team>(`/api/teams/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.teams }); client.invalidateQueries({ queryKey: queryKeys.members }); },
  });
}

export function useDeleteTeam(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/teams/${id}`, { method: 'DELETE' }),
    onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.teams }); client.invalidateQueries({ queryKey: queryKeys.members }); },
  });
}

export function useAddTeamMember(teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => apiFetch<Team>(`/api/teams/${teamId}/members`, { method: 'POST', body: JSON.stringify({ memberId }) }),
    onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.teams }); client.invalidateQueries({ queryKey: queryKeys.members }); },
  });
}

export function useRemoveTeamMember(teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => apiFetch<Team>(`/api/teams/${teamId}/members/${memberId}`, { method: 'DELETE' }),
    onSuccess: () => { client.invalidateQueries({ queryKey: queryKeys.teams }); client.invalidateQueries({ queryKey: queryKeys.members }); },
  });
}
