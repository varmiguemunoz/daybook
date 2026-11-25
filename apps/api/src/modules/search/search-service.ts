import type { Repositories } from '../../ports/repositories';
import type { Member, Task, Team } from '@daybook/domain';

const LIMIT = 8;

export interface SearchResult {
  tasks: Task[];
  members: Member[];
  teams: Team[];
}

function matches(term: string, ...values: string[]): boolean {
  return values.some(value => value.toLowerCase().includes(term));
}

export async function search(repositories: Repositories, workspaceId: string, query: string): Promise<SearchResult> {
  const term = query.trim().toLowerCase();
  if (!term) return { tasks: [], members: [], teams: [] };

  const [tasks, members, teams] = await Promise.all([
    repositories.tasks.list(workspaceId, { search: term.slice(0, 200) }),
    repositories.members.listByWorkspace(workspaceId),
    repositories.teams.listByWorkspace(workspaceId),
  ]);

  return {
    tasks: tasks.slice(0, LIMIT),
    members: members.filter(member => matches(term, member.name, member.email)).slice(0, LIMIT),
    teams: teams.filter(team => matches(term, team.name, team.description)).slice(0, LIMIT),
  };
}
