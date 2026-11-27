import { randomUUID } from 'node:crypto';
import { taskSchema, type ActivityVerb, type CreateTaskInput, type Task, type TaskQuery, type UpdateTaskInput, type Workspace } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { invalidInput, notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';
import { notify } from '../notifications/notification-service';
import { emit } from '../../shared/events/bus';
import { assertQuota } from '../../shared/quotas';

export function listTasks(repositories: Repositories, workspaceId: string, query: TaskQuery): Promise<Task[]> {
  return repositories.tasks.list(workspaceId, query);
}

export async function getTask(repositories: Repositories, workspaceId: string, id: string): Promise<Task> {
  const task = await repositories.tasks.findById(workspaceId, id);
  if (!task) throw notFound('Task');
  return task;
}

async function notifyOnAssign(
  repositories: Repositories,
  workspaceId: string,
  taskId: string,
  taskKey: string,
  taskTitle: string,
  projectId: string | null,
  assigneeId: string,
  actorId: string,
): Promise<void> {
  const assignee = await repositories.members.findById(workspaceId, assigneeId);
  if (!assignee) return;
  await notify(repositories, {
    workspaceId,
    userId: assigneeId,
    type: 'assign',
    actorId,
    taskId,
    projectId,
    text: `You were assigned ${taskKey}`,
    snippet: taskTitle,
    channel: assignee.email ? 'both' : 'inapp',
    recipientEmail: assignee.email,
    emailSubject: `Assigned: ${taskTitle}`,
    emailText: `You were assigned ${taskTitle} (${taskKey}).`,
  });
}

function buildTask(input: CreateTaskInput, workspace: Workspace, number: number): Task {
  const now = Date.now();
  return taskSchema.parse({
    ...input,
    projectId: input.projectId ?? null,
    id: `t_${randomUUID()}`,
    workspaceId: workspace.id,
    key: `TSK-${number}`,
    order: number,
    subtasks: [],
    dependencyIds: [],
    favorite: false,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  });
}

async function assertAssignee(repositories: Repositories, workspaceId: string, assigneeId: string | null | undefined): Promise<void> {
  if (!assigneeId) return;
  const member = await repositories.members.findById(workspaceId, assigneeId);
  if (member?.status !== 'active') throw invalidInput([{ path: 'assigneeId', message: 'Assignee is not an active member of this workspace' }]);
}

export async function createTask(repositories: Repositories, workspace: Workspace, input: CreateTaskInput, actorId: string): Promise<Task> {
  await assertAssignee(repositories, workspace.id, input.assigneeId);
  await assertQuota('tasks', () => repositories.tasks.count(workspace.id));
  const number = await repositories.tasks.nextKeyNumber(workspace.id);
  const task = buildTask(input, workspace, number);

  const created = await repositories.tasks.create(task);
  await recordActivity(repositories, {
    workspaceId: workspace.id,
    actorId,
    verb: 'created',
    taskId: created.id,
    projectId: created.projectId,
    detail: created.key,
  });
  emit(workspace.id, { type: 'task.created', payload: created });

  if (created.assigneeId) {
    await notifyOnAssign(repositories, workspace.id, created.id, created.key, created.title, created.projectId, created.assigneeId, actorId);
  }

  return created;
}

function taskPatch(current: Task, input: UpdateTaskInput): Partial<Task> {
  const patch: Partial<Task> = { ...input, updatedAt: Date.now() };

  if (input.status && input.status !== current.status) {
    patch.completedAt = input.status === 'done' ? Date.now() : null;
  }

  return patch;
}

function verbFor(current: Task, next: Task): ActivityVerb {
  if (current.status === next.status) return 'updated';
  return next.status === 'done' ? 'completed' : 'moved';
}

export async function updateTask(repositories: Repositories, workspace: Workspace, id: string, input: UpdateTaskInput, actorId: string): Promise<Task> {
  const current = await getTask(repositories, workspace.id, id);
  await assertAssignee(repositories, workspace.id, input.assigneeId);
  const updated = await repositories.tasks.update(workspace.id, id, taskPatch(current, input));
  if (!updated) throw notFound('Task');

  await recordActivity(repositories, {
    workspaceId: workspace.id,
    actorId,
    verb: verbFor(current, updated),
    taskId: id,
    projectId: updated.projectId,
    detail: updated.key,
  });
  emit(workspace.id, { type: 'task.updated', payload: updated });

  if (input.assigneeId && input.assigneeId !== current.assigneeId) {
    await notifyOnAssign(repositories, workspace.id, id, updated.key, updated.title, updated.projectId, input.assigneeId, actorId);
  }

  return updated;
}

export async function deleteTask(repositories: Repositories, workspace: Workspace, id: string, actorId: string): Promise<void> {
  const task = await getTask(repositories, workspace.id, id);
  const removed = await repositories.tasks.remove(workspace.id, id);
  if (!removed) throw notFound('Task');

  await recordActivity(repositories, {
    workspaceId: workspace.id,
    actorId,
    verb: 'deleted',
    taskId: id,
    projectId: task.projectId,
    detail: task.key,
  });
  emit(workspace.id, { type: 'task.deleted', payload: { id } });
}
