import { randomUUID } from 'node:crypto';
import { notificationSchema, type Notification } from '@gr8r/domain';
import type { Repositories } from '../../ports/repositories';
import { notFound } from '../../http/errors';

export interface NotifyInput {
  workspaceId: string;
  userId: string;
  type: Notification['type'];
  actorId?: string | null;
  taskId?: string | null;
  projectId?: string | null;
  text: string;
  snippet?: string;
  channel?: Notification['channel'];
  recipientEmail?: string;
  emailSubject?: string;
  emailHtml?: string;
}

async function deliverEmail(input: NotifyInput, notificationId: string, repositories: Repositories): Promise<void> {
  if (input.channel === 'inapp' || !input.recipientEmail || !input.emailSubject) return;
  const { sendEmail } = await import('../../shared/notifications/email');
  const sent = await sendEmail(input.recipientEmail, input.emailSubject, input.emailHtml ?? input.text);
  if (sent) await repositories.notifications.update(notificationId, { emailedAt: Date.now() });
}

export async function notify(repositories: Repositories, input: NotifyInput): Promise<Notification> {
  const notification = notificationSchema.parse({
    id: `n_${randomUUID()}`,
    workspaceId: input.workspaceId,
    userId: input.userId,
    type: input.type,
    actorId: input.actorId ?? null,
    taskId: input.taskId ?? null,
    projectId: input.projectId ?? null,
    text: input.text,
    snippet: input.snippet ?? '',
    read: false,
    channel: input.channel ?? 'inapp',
    emailedAt: null,
    at: Date.now(),
  });
  const created = await repositories.notifications.create(notification);
  await deliverEmail(input, created.id, repositories);
  return created;
}

export async function listNotifications(repositories: Repositories, userId: string, unreadOnly?: boolean): Promise<Notification[]> {
  return repositories.notifications.listByUser(userId, unreadOnly);
}

export async function markRead(repositories: Repositories, userId: string, id: string): Promise<Notification> {
  const updated = await repositories.notifications.markRead(userId, id);
  if (!updated) throw notFound('Notification');
  return updated;
}

export async function markAllRead(repositories: Repositories, userId: string): Promise<number> {
  return repositories.notifications.markAllRead(userId);
}
