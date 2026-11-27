import { z } from 'zod';
import { idSchema } from '@daybook/domain';
import { listNotifications, markAllRead, markRead } from '../../notifications/notification-service';
import { defineTool, page, pageFields, reply, scoped } from '../tool-kit';

export const notificationTools = [
  defineTool({
    name: 'list_notifications',
    title: 'List notifications',
    description: "The user's notifications in the workspace, newest first. Set unread to see only the ones not read yet.",
    access: 'read',
    input: scoped({ unread: z.boolean().optional(), ...pageFields }),
    run: async (call, { unread, limit, cursor }) => {
      const { member } = await call.scope();
      const notifications = await listNotifications(call.session.deps.repositories, member.id, unread ?? false);
      const result = page(notifications, { limit, cursor });
      return reply(`${result.total} notification(s).`, result);
    },
  }),
  defineTool({
    name: 'mark_notification_read',
    title: 'Mark notification read',
    description: 'Mark one notification as read.',
    access: 'write',
    input: scoped({ notification: idSchema }),
    run: async (call, args) => {
      const { member } = await call.scope();
      const notification = await markRead(call.session.deps.repositories, member.id, args.notification);
      return reply('Marked as read.', { notification });
    },
  }),
  defineTool({
    name: 'mark_all_notifications_read',
    title: 'Mark all notifications read',
    description: "Mark every one of the user's notifications in the workspace as read.",
    access: 'write',
    input: scoped({}),
    run: async call => {
      const { member } = await call.scope();
      const updated = await markAllRead(call.session.deps.repositories, member.id);
      return reply(`Marked ${updated} notification(s) as read.`, { updated });
    },
  }),
];
