import type { Repositories } from '../../ports/repositories';
import type { Member, Task } from '@gr8r/domain';

export interface SearchResult {
  tasks: Task[];
  members: Member[];
}

export async function search(repositories: Repositories, workspaceId: string, query: string): Promise<SearchResult> {
  const term = query.trim().toLowerCase();
  if (!term) return { tasks: [], members: [] };

  const [tasks, members] = await Promise.all([repositories.tasks.list(workspaceId, { search: term }), repositories.members.listByWorkspace(workspaceId)]);

  return {
    tasks,
    members: members.filter(member => member.name.toLowerCase().includes(term) || member.email.toLowerCase().includes(term)),
  };
}
