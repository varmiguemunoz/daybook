import type { Member, Task, TaskStatus } from '@gr8r/domain';
import { PRIORITY_WEIGHT, TASK_STATUSES } from '@gr8r/domain';
import { diffDays, parseDate, TODAY } from '../../shared/dates';

export type GroupBy = 'status' | 'priority' | 'assignee' | 'none';
export type SortBy = 'manual' | 'title' | 'due' | 'priority' | 'status';

export interface TaskGroup {
  key: string;
  name: string;
  tasks: Task[];
}

const SORTERS: Record<SortBy, (task: Task) => string | number> = {
  manual: task => task.order,
  title: task => task.title.toLowerCase(),
  due: task => task.dueDate ?? '9999-99-99',
  priority: task => -PRIORITY_WEIGHT[task.priority],
  status: task => TASK_STATUSES.indexOf(task.status),
};

export function sortTasks(tasks: Task[], by: SortBy = 'manual'): Task[] {
  const key = SORTERS[by];
  return [...tasks].sort((left, right) => {
    const a = key(left);
    const b = key(right);
    if (a === b) return 0;
    return a > b ? 1 : -1;
  });
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const term = query.trim().toLowerCase();
  if (!term) return tasks;
  return tasks.filter(task => task.title.toLowerCase().includes(term) || task.key.toLowerCase().includes(term));
}

export function tasksByStatus(tasks: Task[], status: TaskStatus): Task[] {
  return sortTasks(
    tasks.filter(task => task.status === status),
    'manual',
  );
}

export function subtaskProgress(task: Task): number {
  if (!task.subtasks.length) return 0;
  return Math.round((task.subtasks.filter(subtask => subtask.done).length / task.subtasks.length) * 100);
}

function memberGroups(members: Member[], tasks: Task[]): TaskGroup[] {
  const groups = members.map(member => ({
    key: member.id,
    name: member.name,
    tasks: tasks.filter(task => task.assigneeId === member.id),
  }));
  const unassigned = tasks.filter(task => task.assigneeId === null);
  if (unassigned.length) groups.push({ key: 'none', name: 'Unassigned', tasks: unassigned });
  return groups;
}

function dueBucket(task: Task): string {
  const due = parseDate(task.dueDate);
  if (!due) return 'nodate';
  const delta = diffDays(due, TODAY);
  if (delta < 0) return 'overdue';
  if (delta === 0) return 'today';
  if (delta <= 7) return 'week';
  return 'later';
}

const DUE_BUCKETS: Array<[string, string]> = [
  ['overdue', 'Overdue'],
  ['today', 'Today'],
  ['week', 'Next 7 days'],
  ['later', 'Later'],
  ['nodate', 'No due date'],
];

export function groupTasks(tasks: Task[], group: GroupBy, members: Member[]): TaskGroup[] {
  if (group === 'none') return [{ key: 'all', name: 'All tasks', tasks }];

  if (group === 'status') {
    return TASK_STATUSES.map(status => ({
      key: status,
      name: status,
      tasks: tasks.filter(task => task.status === status),
    }));
  }

  if (group === 'priority') {
    return (['urgent', 'high', 'medium', 'low', 'none'] as const).map(priority => ({
      key: priority,
      name: priority,
      tasks: tasks.filter(task => task.priority === priority),
    }));
  }

  if (group === 'assignee') return memberGroups(members, tasks).filter(entry => entry.tasks.length > 0);

  return DUE_BUCKETS.map(([key, name]) => ({
    key,
    name,
    tasks: tasks.filter(task => dueBucket(task) === key),
  })).filter(entry => entry.tasks.length > 0);
}
