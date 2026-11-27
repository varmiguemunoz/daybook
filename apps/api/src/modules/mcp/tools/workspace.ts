import { z } from 'zod';
import { recentActivity } from '../../activity/activity-service';
import { search } from '../../search/search-service';
import { defineTool, reply, scoped } from '../tool-kit';

export const workspaceTools = [
  defineTool({
    name: 'list_workspaces',
    title: 'List workspaces',
    description: 'List the workspaces (organizations) this user belongs to, with their role in each. Pass one as `workspace` to the other tools.',
    access: 'read',
    input: z.object({}),
    run: async call => {
      const organizations = await call.session.organizations();
      const workspaces = organizations.map(org => ({ id: org.orgId, name: org.orgName, role: org.orgRole === 'org:admin' ? 'admin' : 'member' }));
      return reply(`${workspaces.length} workspace(s).`, { workspaces });
    },
  }),
  defineTool({
    name: 'get_workspace_overview',
    title: 'Workspace overview',
    description: 'Who the user is in the workspace, its members, and counts of open tasks, notes and teams. A good first call.',
    access: 'read',
    input: scoped({}),
    run: async call => {
      const { workspace, member } = await call.scope();
      const { repositories } = call.session.deps;
      const [members, tasks, notes, teams] = await Promise.all([
        repositories.members.listByWorkspace(workspace.id),
        repositories.tasks.list(workspace.id, {}),
        repositories.notes.count(workspace.id),
        repositories.teams.listByWorkspace(workspace.id),
      ]);
      const open = tasks.filter(task => task.status !== 'done');
      const counts = { openTasks: open.length, myOpenTasks: open.filter(task => task.assigneeId === member.id).length, notes, teams: teams.length };
      const people = members.map(({ id, name, email, role, status }) => ({ id, name, email, role, status }));
      return reply(`${workspace.name}: ${counts.openTasks} open tasks, ${counts.notes} notes.`, { workspace, me: member, members: people, counts });
    },
  }),
  defineTool({
    name: 'search',
    title: 'Search',
    description: 'Search task titles and keys, note titles, people and teams in one go.',
    access: 'read',
    input: scoped({ query: z.string().min(1).max(200) }),
    run: async (call, { query }) => {
      const { workspace } = await call.scope();
      const found = await search(call.session.deps.repositories, workspace.id, query);
      const total = found.tasks.length + found.notes.length + found.members.length + found.teams.length;
      return reply(`${total} result(s) for "${query}".`, { ...found });
    },
  }),
  defineTool({
    name: 'get_activity',
    title: 'Recent activity',
    description: 'The latest changes in the workspace, newest first.',
    access: 'read',
    input: scoped({ limit: z.number().int().min(1).max(100).optional() }),
    run: async (call, { limit }) => {
      const { workspace } = await call.scope();
      const activity = await recentActivity(call.session.deps.repositories, workspace.id, limit ?? 20);
      return reply(`${activity.length} recent change(s).`, { activity });
    },
  }),
];
