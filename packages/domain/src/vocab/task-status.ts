export const TASK_STATUSES = ['backlog', 'todo', 'progress', 'review', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

export const STATUS_PROGRESS: Record<TaskStatus, number> = {
  backlog: 0,
  todo: 5,
  progress: 45,
  review: 80,
  done: 100,
};
