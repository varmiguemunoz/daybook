import { useState } from 'react';
import type { Notification } from '@daybook/domain';
import { Icon } from '../modules/core/components/Icon';
import { Skeleton } from '../modules/core/components/Skeleton';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../modules/notifications/services/queries';
import { useMembers } from '../modules/members/services/queries';
import { useTaskUi } from '../modules/tasks/states/task-ui-store';
import { NotificationGroups } from '../modules/notifications/components/NotificationGroups';

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data: notifications = [], isLoading, error } = useNotifications(unreadOnly);
  const { data: unread = [] } = useNotifications(true);
  const { data: members = [] } = useMembers();
  const markAll = useMarkAllNotificationsRead();
  const markRead = useMarkNotificationRead();
  const openTask = useTaskUi(state => state.openTask);

  function open(notification: Notification) {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.taskId) openTask(notification.taskId);
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="ph">
        <div>
          <h1>Notifications</h1>
          <p>Assignments and comments on your tasks.</p>
        </div>
        <div className="acts">
          <div className="seg" role="group" aria-label="Show">
            <button type="button" className={unreadOnly ? '' : 'on'} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>
              All
            </button>
            <button type="button" className={unreadOnly ? 'on' : ''} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>
              Unread{unread.length > 0 && <span className="num"> · {unread.length}</span>}
            </button>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending || unread.length === 0}>
            <Icon name="check-check" size={14} />
            Mark all as read
          </button>
        </div>
      </div>
      {error && <p className="error">{error.message}</p>}
      {isLoading ? <Skeleton lines={6} /> : <NotificationGroups notifications={notifications} members={members} unreadOnly={unreadOnly} onOpen={open} />}
    </div>
  );
}
