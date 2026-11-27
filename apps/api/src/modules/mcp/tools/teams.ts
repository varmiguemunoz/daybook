import { idSchema, updateTeamInputSchema } from '@daybook/domain';
import { z } from 'zod';
import { addMemberToTeam, createTeam, deleteTeam, listTeams, removeMemberFromTeam, updateTeam } from '../../teams/team-service';
import { defineTool, fieldsOf, reply, scoped } from '../tool-kit';

const teamId = idSchema.describe('Team id from list_teams');
const memberId = idSchema.describe('Member id from list_members');
const teamFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().max(200).default(''),
  icon: z.string().max(40).default('users').describe('Lucide icon name'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default('#6B7280'),
  memberIds: z.array(idSchema).default([]),
};

export const teamTools = [
  defineTool({
    name: 'list_teams',
    title: 'List teams',
    description: 'List teams with their member ids.',
    access: 'read',
    input: scoped({}),
    run: async call => {
      const { workspace } = await call.scope();
      const teams = await listTeams(call.session.deps.repositories, workspace.id);
      return reply(`${teams.length} team(s).`, { teams });
    },
  }),
  defineTool({
    name: 'create_team',
    title: 'Create team',
    description: 'Create a team. Admins only.',
    access: 'write',
    input: scoped(teamFields),
    run: async (call, args) => {
      const input = fieldsOf(args);
      const { workspace, member } = await call.scope('workspace:manage');
      const team = await createTeam(call.session.deps.repositories, workspace.id, input, member.id);
      return reply(`Created team "${team.name}".`, { team });
    },
  }),
  defineTool({
    name: 'update_team',
    title: 'Update team',
    description: 'Rename a team or change its description, icon, color or full member list. Admins only.',
    access: 'write',
    input: scoped({ team: teamId, ...updateTeamInputSchema.shape }),
    run: async (call, args) => {
      const { team: id, ...input } = fieldsOf(args);
      const { workspace } = await call.scope('workspace:manage');
      const team = await updateTeam(call.session.deps.repositories, workspace.id, id, input);
      return reply(`Saved team "${team.name}".`, { team });
    },
  }),
  defineTool({
    name: 'add_team_member',
    title: 'Add to team',
    description: 'Add one member to a team. Admins only.',
    access: 'write',
    input: scoped({ team: teamId, member: memberId }),
    run: async (call, args) => {
      const { workspace } = await call.scope('workspace:manage');
      const team = await addMemberToTeam(call.session.deps.repositories, workspace.id, args.team, args.member);
      return reply(`Added to "${team.name}".`, { team });
    },
  }),
  defineTool({
    name: 'remove_team_member',
    title: 'Remove from team',
    description: 'Take one member out of a team; they stay in the workspace. Admins only.',
    access: 'write',
    input: scoped({ team: teamId, member: memberId }),
    run: async (call, args) => {
      const { workspace } = await call.scope('workspace:manage');
      const team = await removeMemberFromTeam(call.session.deps.repositories, workspace.id, args.team, args.member);
      return reply(`Removed from "${team.name}".`, { team });
    },
  }),
  defineTool({
    name: 'delete_team',
    title: 'Delete team',
    description: 'Delete a team. Its members stay in the workspace. Admins only. This cannot be undone.',
    access: 'destructive',
    input: scoped({ team: teamId }),
    run: async (call, args) => {
      const { workspace, member } = await call.scope('workspace:manage');
      await deleteTeam(call.session.deps.repositories, workspace.id, args.team, member.id);
      return reply('Team deleted.', { deleted: args.team });
    },
  }),
];
