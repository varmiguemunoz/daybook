import { randomUUID } from 'node:crypto';
import { teamSchema, type CreateTeamInput, type Team, type UpdateTeamInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';

export async function listTeams(repositories: Repositories, workspaceId: string): Promise<Team[]> {
  return repositories.teams.listByWorkspace(workspaceId);
}

export async function getTeam(repositories: Repositories, id: string): Promise<Team> {
  const team = await repositories.teams.findById(id);
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

export async function updateTeam(repositories: Repositories, id: string, input: UpdateTeamInput): Promise<Team> {
  const current = await getTeam(repositories, id);
  const updated = await repositories.teams.update(current.id, { ...input, updatedAt: Date.now() });
  if (!updated) throw notFound('Team');
  return updated;
}

export async function deleteTeam(repositories: Repositories, workspaceId: string, id: string, actorId: string): Promise<void> {
  const team = await getTeam(repositories, id);
  // cascade: unset teamId on members
  const members = await repositories.members.listByWorkspace(workspaceId);
  for (const member of members) {
    if (member.teamId === id) {
      await repositories.members.update(member.id, { teamId: null });
    }
  }
  const removed = await repositories.teams.remove(id);
  if (!removed) throw notFound('Team');
  await recordActivity(repositories, { workspaceId, actorId, verb: 'deleted', detail: team.name });
}

export async function addMemberToTeam(repositories: Repositories, teamId: string, memberId: string): Promise<Team> {
  const team = await getTeam(repositories, teamId);
  const member = await repositories.members.findById(memberId);
  if (!member) throw notFound('Member');
  if (!team.memberIds.includes(memberId)) {
    await repositories.teams.update(teamId, { memberIds: [...team.memberIds, memberId] });
  }
  await repositories.members.update(memberId, { teamId });
  const updated = await repositories.teams.findById(teamId);
  if (!updated) throw notFound('Team');
  return updated;
}

export async function removeMemberFromTeam(repositories: Repositories, teamId: string, memberId: string): Promise<Team> {
  const team = await getTeam(repositories, teamId);
  await repositories.teams.update(teamId, { memberIds: team.memberIds.filter(id => id !== memberId) });
  await repositories.members.update(memberId, { teamId: null });
  const updated = await repositories.teams.findById(teamId);
  if (!updated) throw notFound('Team');
  return updated;
}
