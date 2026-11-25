import type { Member } from '@gr8r/domain';
import { useMembers } from '../members/queries';
import { useTasks } from '../tasks/queries';

export function useViewData() {
  const tasksQuery = useTasks();
  const membersQuery = useMembers();

  const tasks = tasksQuery.data ?? [];
  const members = membersQuery.data ?? [];

  return {
    tasks,
    members,
    isLoading: tasksQuery.isLoading,
    error: tasksQuery.error,
    memberById: new Map(members.map(member => [member.id, member])) as Map<string, Member>,
  };
}
