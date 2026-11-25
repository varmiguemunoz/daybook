import type { Activity, Member, Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';

export interface Bootstrap {
  workspace: Workspace;
  me: Member;
  members: Member[];
  activity: Activity[];
}

export async function loadBootstrap(repositories: Repositories, workspace: Workspace, me: Member): Promise<Bootstrap> {
  const [members, activity] = await Promise.all([repositories.members.listByWorkspace(workspace.id), repositories.activity.recent(workspace.id, 20)]);
  return { workspace, me, members, activity };
}
