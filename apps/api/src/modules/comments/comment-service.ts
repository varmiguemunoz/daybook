import { randomUUID } from 'node:crypto';
import { can, commentSchema, type Comment, type CreateCommentInput, type Member } from '@daybook/domain';
import type { Repositories } from '../../ports/repositories';
import { forbidden, notFound } from '../../http/errors';
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
    emailText: `New comment on ${task.title}: ${body.slice(0, 200)}`,
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

async function getComment(repositories: Repositories, workspaceId: string, id: string): Promise<Comment> {
  const comment = await repositories.comments.findById(workspaceId, id);
  if (!comment) throw notFound('Comment');
  return comment;
}

export async function updateComment(repositories: Repositories, workspaceId: string, id: string, actor: Member, body: string): Promise<Comment> {
  const comment = await getComment(repositories, workspaceId, id);
  if (comment.authorId !== actor.id) throw forbidden('edit comments written by someone else');
  const updated = await repositories.comments.update(workspaceId, id, { body, editedAt: Date.now() });
  if (!updated) throw notFound('Comment');
  return updated;
}

export async function deleteComment(repositories: Repositories, workspaceId: string, id: string, actor: Member): Promise<void> {
  const comment = await getComment(repositories, workspaceId, id);
  if (comment.authorId !== actor.id && !can(actor.role, 'workspace:manage')) throw forbidden('delete comments written by someone else');
  const removed = await repositories.comments.remove(workspaceId, id);
  if (!removed) throw notFound('Comment');
}

export async function toggleReaction(repositories: Repositories, workspaceId: string, commentId: string, memberId: string, emoji: string): Promise<Comment> {
  const current = await getComment(repositories, workspaceId, commentId);
  const reactions = new Map(Object.entries(current.reactions));
  const list = reactions.get(emoji) ?? [];
  const next = list.includes(memberId) ? list.filter(id => id !== memberId) : [...list, memberId];
  if (next.length === 0) reactions.delete(emoji);
  else reactions.set(emoji, next);
  const updated = await repositories.comments.update(workspaceId, commentId, { reactions: Object.fromEntries(reactions) });
  if (!updated) throw notFound('Comment');
  return updated;
}
