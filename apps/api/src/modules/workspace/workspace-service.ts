import type { Activity, Member, Task, Workspace } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';

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
