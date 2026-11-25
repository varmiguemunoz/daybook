import { useOrganization } from '@clerk/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../../core/services/api-client';
import type { Member, Role, UpdateMemberInput } from '@daybook/domain';

function useActiveOrganization() {
  const { organization } = useOrganization();
  return () => {
    if (!organization) throw new Error('No active organization');
    return organization;
  };
}

export function useCanManageOrganization(): boolean {
  return useOrganization().membership?.role === 'org:admin';
}

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members,
    queryFn: () => apiFetch<Member[]>('/api/members'),
  });
}

export function useInviteMember() {
  const organization = useActiveOrganization();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) => organization().inviteMember({ emailAddress: email, role: `org:${role}` }),
  });
}

export function useUpdateMember(id: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemberInput) => apiFetch<Member>(`/api/members/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useChangeRole(member: Member) {
  const client = useQueryClient();
  const organization = useActiveOrganization();
  return useMutation({
    mutationFn: (role: Role) => organization().updateMember({ userId: member.clerkUserId, role: `org:${role}` }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useRemoveMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch<void>(`/api/members/${id}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all([queryKeys.members, queryKeys.tasks, queryKeys.teams, queryKeys.bootstrap].map(queryKey => client.invalidateQueries({ queryKey }))),
  });
}
