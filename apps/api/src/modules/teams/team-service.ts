import { randomUUID } from 'node:crypto';
import { teamSchema, type CreateTeamInput, type Team, type UpdateTeamInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';

export async function listTeams(repositories: Repositories, workspaceId: string): Promise<Team[]> {
  return repositories.teams.listByWorkspace(workspaceId);
}

export async function getTeam(repositories: Repositories, workspaceId: string, id: string): Promise<Team> {
  const team = await repositories.teams.findById(workspaceId, id);
  if (!team) throw notFound('Team');
  return team;
}

export async function createTeam(repositories: Repositories, workspaceId: string, input: CreateTeamInput, actorId: string): Promise<Team> {
  const now = Date.now();
  const team = teamSchema.parse({
    ...input,
    id: `team_${randomUUID()}`,
    workspaceId,
    memberIds: input.memberIds ?? [],
    createdAt: now,
    updatedAt: now,
  });
  const created = await repositories.teams.create(team);
  await recordActivity(repositories, { workspaceId, actorId, verb: 'created', detail: created.name });
  return created;
}

async function saveTeam(repositories: Repositories, workspaceId: string, id: string, patch: Partial<Team>): Promise<Team> {
  const updated = await repositories.teams.update(workspaceId, id, { ...patch, updatedAt: Date.now() });
  if (!updated) throw notFound('Team');
  return updated;
}

export function updateTeam(repositories: Repositories, workspaceId: string, id: string, input: UpdateTeamInput): Promise<Team> {
  return saveTeam(repositories, workspaceId, id, input);
}

export async function deleteTeam(repositories: Repositories, workspaceId: string, id: string, actorId: string): Promise<void> {
  const team = await getTeam(repositories, workspaceId, id);
  const members = await repositories.members.listByWorkspace(workspaceId);
  await Promise.all(members.filter(member => member.teamId === id).map(member => repositories.members.update(workspaceId, member.id, { teamId: null })));
  await repositories.teams.remove(workspaceId, id);
  await recordActivity(repositories, { workspaceId, actorId, verb: 'deleted', detail: team.name });
}

export async function addMemberToTeam(repositories: Repositories, workspaceId: string, teamId: string, memberId: string): Promise<Team> {
  const team = await getTeam(repositories, workspaceId, teamId);
  const member = await repositories.members.update(workspaceId, memberId, { teamId });
  if (!member) throw notFound('Member');
  const memberIds = team.memberIds.includes(memberId) ? team.memberIds : [...team.memberIds, memberId];
  return saveTeam(repositories, workspaceId, teamId, { memberIds });
}

export async function removeMemberFromTeam(repositories: Repositories, workspaceId: string, teamId: string, memberId: string): Promise<Team> {
  const team = await getTeam(repositories, workspaceId, teamId);
  await repositories.members.update(workspaceId, memberId, { teamId: null });
  return saveTeam(repositories, workspaceId, teamId, { memberIds: team.memberIds.filter(id => id !== memberId) });
}
