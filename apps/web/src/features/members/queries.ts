import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../shared/api/client';
import type { CreateInvitationInput, Invitation, Member } from '@gr8r/domain';

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: () => apiFetch<Member[]>('/api/members'),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: () => apiFetch<Invitation[]>('/api/invitations'),
  });
}

export function useCreateInvitation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInvitationInput) => apiFetch<Invitation>('/api/invitations', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => { client.invalidateQueries({ queryKey: ['invitations'] }); client.invalidateQueries({ queryKey: queryKeys.members }); }
  });
}

export function useUpdateMember(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Member>) => apiFetch<Member>(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useChangeRole(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (role: Member['role']) => apiFetch<Member>(`/api/members/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useDeactivateMember(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>(`/api/members/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.members }),
  });
}
