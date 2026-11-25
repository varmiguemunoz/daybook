import type { Member } from '@gr8r/domain';
import { useMembers } from '../members/queries';
import { filterTasks, type TaskFilter } from '../views/view-model';
import { useTasks } from './queries';
import { DEFAULT_VIEW, useTaskUi, type TaskViewKey } from './task-ui-store';

export function useTaskView(key: TaskViewKey) {
  const tasksQuery = useTasks();
  const { data: members = [] } = useMembers();
  const view = useTaskUi(state => state.views[key]) ?? DEFAULT_VIEW;
  const setView = useTaskUi(state => state.setView);

  return {
    tasks: filterTasks(tasksQuery.data ?? [], view.query, view.filter),
    members,
    memberById: new Map(members.map(member => [member.id, member])) as Map<string, Member>,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    query: view.query,
    filter: view.filter,
    setQuery: (query: string) => setView(key, { query }),
    setFilter: (filter: TaskFilter) => setView(key, { filter }),
  };
}
