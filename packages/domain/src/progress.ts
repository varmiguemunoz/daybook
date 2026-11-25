import { STATUS_PROGRESS, type TaskStatus } from './vocab/task-status';
import type { Task } from './schemas/task';

export function taskProgress(task: Task): number {
  if (task.status === 'done') return STATUS_PROGRESS.done;
  if (task.subtasks.length === 0) return STATUS_PROGRESS[task.status];
  const done = task.subtasks.filter(subtask => subtask.done).length;
  return Math.round((done / task.subtasks.length) * 100);
}

export function projectProgress(tasks: readonly Task[]): number {
  if (tasks.length === 0) return 0;
  const done = tasks.filter(task => task.status === 'done').length;
  return Math.round((done / tasks.length) * 100);
}

export function isOverdue(task: Task, todayIso: string): boolean {
  if (!task.dueDate) return false;
  if (task.status === 'done') return false;
  return task.dueDate < todayIso;
}

export function statusAfterCompletion(status: TaskStatus): TaskStatus {
  return status === 'done' ? 'todo' : 'done';
}
