import { randomUUID } from 'node:crypto';
import type { Activity, Member, Task, Workspace } from '@gr8r/domain';
import { workspaceSchema, type CreateWorkspaceInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';

export interface Bootstrap {
  workspace: Workspace;
  me: Member;
  members: Member[];
  tasks: Task[];
  activity: Activity[];
}

export async function loadBootstrap(repositories: Repositories, workspace: Workspace, me: Member): Promise<Bootstrap> {
  const [members, tasks, activity] = await Promise.all([
    repositories.members.listByWorkspace(workspace.id),
    repositories.tasks.list(workspace.id, {}),
    repositories.activity.recent(workspace.id, 20),
  ]);

  return { workspace, me, members, tasks, activity };
}

export function listMembers(repositories: Repositories, workspaceId: string): Promise<Member[]> {
  return repositories.members.listByWorkspace(workspaceId);
}

export async function getWorkspace(repositories: Repositories, id: string): Promise<Workspace> {
  const workspace = await repositories.workspaces.findById(id);
  if (!workspace) throw notFound('Workspace');
  return workspace;
}

export async function updateWorkspace(repositories: Repositories, id: string, patch: Partial<Workspace>): Promise<Workspace> {
  const current = await getWorkspace(repositories, id);
  const updated = await repositories.workspaces.update(current.id, patch);
  if (!updated) throw notFound('Workspace');
  return updated;
}

export async function createWorkspace(repositories: Repositories, input: CreateWorkspaceInput): Promise<Workspace> {
  const now = Date.now();
  const workspace = workspaceSchema.parse({
    id: `w_${randomUUID()}`,
    name: input.name,
    slug: input.slug,
    color: input.color ?? '#1D1C1A',
    createdAt: now,
  });
  return repositories.workspaces.create(workspace);
}
