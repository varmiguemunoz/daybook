import { taskSchema, type Task } from './schemas/task';

const NOW = 1_700_000_000_000;

export const taskFixture: Task = taskSchema.parse({
  id: 't1',
  workspaceId: 'w1',
  projectId: 'p1',
  key: 'WEB-101',
  title: 'Finalize navigation',
  status: 'progress',
  priority: 'high',
  createdAt: NOW,
  updatedAt: NOW,
});

export function parseTask(overrides: Record<string, unknown>): Task {
  return taskSchema.parse({ ...taskFixture, ...overrides });
}
