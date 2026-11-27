import { z } from 'zod';
import { ROLES, idSchema } from '@daybook/domain';
import { assertAdminChange, getMember, listMembers, purgeMember } from '../../members/member-service';
import { emit } from '../../../shared/events/bus';
import { defineTool, reply, scoped } from '../tool-kit';

const memberId = idSchema.describe('Member id from list_members');
const role = z.enum(ROLES);

export const memberTools = [
  defineTool({
    name: 'list_members',
    title: 'List members',
    description: 'List the people in the workspace with their member id, email, role and status. Use the id as assigneeId on tasks.',
    access: 'read',
    input: scoped({}),
    run: async call => {
      const { workspace } = await call.scope();
      const members = await listMembers(call.session.deps.repositories, workspace.id);
      return reply(`${members.length} member(s).`, { members });
    },
  }),
  defineTool({
    name: 'invite_member',
    title: 'Invite member',
    description: 'Email an invitation to join the workspace. Admins only. The person appears in list_members after they accept.',
    access: 'write',
    input: scoped({ email: z.email(), role: role.default('member') }),
    run: async (call, args) => {
      const { workspace } = await call.scope('workspace:manage');
      await call.session.deps.directory.invite({ orgId: workspace.clerkOrgId, inviterUserId: call.session.userId, email: args.email, role: args.role });
      return reply(`Invitation sent to ${args.email} as ${args.role}.`, { invited: args.email, role: args.role });
    },
  }),
  defineTool({
    name: 'update_member_role',
    title: 'Change member role',
    description: 'Make a member an admin or a member. Admins only; a workspace always keeps one admin.',
    access: 'write',
    input: scoped({ member: memberId, role }),
    run: async (call, args) => {
      const { workspace, member: actor } = await call.scope('workspace:manage');
      const { repositories, directory } = call.session.deps;
      const target = await getMember(repositories, workspace.id, args.member);
      await assertAdminChange(repositories, actor, target, args.role);
      await directory.setRole(workspace.clerkOrgId, target.clerkUserId, args.role);
      const member = await repositories.members.update(workspace.id, target.id, { role: args.role });
      emit(workspace.id, { type: 'member.updated', payload: target.id });
      return reply(`${target.name} is now ${args.role}.`, { member });
    },
  }),
  defineTool({
    name: 'remove_member',
    title: 'Remove member',
    description: 'Remove someone from the workspace: they lose access and their tasks become unassigned. Admins only. This cannot be undone.',
    access: 'destructive',
    input: scoped({ member: memberId }),
    run: async (call, args) => {
      const { workspace, member: actor } = await call.scope('workspace:manage');
      const { repositories, removeMembership } = call.session.deps;
      const target = await getMember(repositories, workspace.id, args.member);
      await assertAdminChange(repositories, actor, target, null);
      await removeMembership(workspace.clerkOrgId, target.clerkUserId);
      await purgeMember(repositories, workspace.id, target.id);
      return reply(`Removed ${target.name}.`, { removed: target.id });
    },
  }),
];
