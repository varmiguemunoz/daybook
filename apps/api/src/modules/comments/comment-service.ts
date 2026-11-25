import { randomUUID } from 'node:crypto';
import { commentSchema, type Comment, type CreateCommentInput } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';
import { recordActivity } from '../activity/activity-service';
import { notify } from '../notifications/notification-service';
import { emit } from '../../shared/events/bus';

export async function listComments(repositories: Repositories, workspaceId: string, taskId: string): Promise<Comment[]> {
  return repositories.comments.listByTask(workspaceId, taskId);
}

async function notifyAssignee(
  repositories: Repositories,
  task: { id: string; assigneeId: string | null; key: string; title: string; projectId: string | null },
  workspaceId: string,
  authorId: string,
  body: string,
): Promise<void> {
  if (!task.assigneeId || task.assigneeId === authorId) return;
  const assignee = await repositories.members.findById(workspaceId, task.assigneeId);
  if (!assignee) return;
  await notify(repositories, {
    workspaceId,
    userId: task.assigneeId,
    type: 'comment',
    actorId: authorId,
    taskId: task.id,
    projectId: task.projectId,
    text: `New comment on ${task.key}`,
    snippet: body.slice(0, 120),
    channel: assignee.email ? 'both' : 'inapp',
    recipientEmail: assignee.email,
    emailSubject: `Comment on ${task.title}`,
    emailHtml: `<p>New comment on <b>${task.title}</b>: ${body.slice(0, 200)}</p>`,
  });
}

export async function createComment(
  repositories: Repositories,
  workspaceId: string,
  taskId: string,
  authorId: string,
  input: CreateCommentInput,
): Promise<Comment> {
  const task = await repositories.tasks.findById(workspaceId, taskId);
  if (!task) throw notFound('Task');

  const comment = commentSchema.parse({
    ...input,
    id: `c_${randomUUID()}`,
    workspaceId,
    taskId,
    authorId,
    reactions: {},
    createdAt: Date.now(),
    editedAt: null,
  });
  const created = await repositories.comments.create(comment);
  await recordActivity(repositories, {
    workspaceId,
    actorId: authorId,
    verb: 'commented',
    taskId,
    detail: created.body.slice(0, 80),
  });
  emit(workspaceId, { type: 'comment.created', payload: created });

  await notifyAssignee(repositories, task, workspaceId, authorId, created.body);

  return created;
}

export async function updateComment(repositories: Repositories, workspaceId: string, id: string, body: string): Promise<Comment> {
  const updated = await repositories.comments.update(workspaceId, id, { body, editedAt: Date.now() });
  if (!updated) throw notFound('Comment');
  return updated;
}

export async function deleteComment(repositories: Repositories, workspaceId: string, id: string): Promise<void> {
  const removed = await repositories.comments.remove(workspaceId, id);
  if (!removed) throw notFound('Comment');
}

export async function toggleReaction(repositories: Repositories, workspaceId: string, commentId: string, memberId: string, emoji: string): Promise<Comment> {
  const current = await repositories.comments.findById(workspaceId, commentId);
  if (!current) throw notFound('Comment');
  const reactions = { ...current.reactions };
  const list = reactions[emoji] ?? [];
  const next = list.includes(memberId) ? list.filter(id => id !== memberId) : [...list, memberId];
  if (next.length === 0) delete reactions[emoji];
  else reactions[emoji] = next;
  const updated = await repositories.comments.update(workspaceId, commentId, { reactions });
  if (!updated) throw notFound('Comment');
  return updated;
}
