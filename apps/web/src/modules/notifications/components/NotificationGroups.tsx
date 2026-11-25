import type { Member, Notification } from '@daybook/domain';
import { EmptyState } from '../../core/components/EmptyState';
import { dayBucket } from '../../core/utils/dates';
import { NotificationRow } from './NotificationRow';

interface Props {
  notifications: Notification[];
  members: Member[];
  unreadOnly: boolean;
  onOpen: (notification: Notification) => void;
}

function byDay(notifications: Notification[]): Map<string, Notification[]> {
  const buckets = new Map<string, Notification[]>();
  for (const notification of notifications) {
    const key = dayBucket(notification.at);
    buckets.set(key, [...(buckets.get(key) ?? []), notification]);
  }
  return buckets;
}

export function NotificationGroups({ notifications, members, unreadOnly, onOpen }: Props) {
  const memberById = new Map(members.map(member => [member.id, member]));

  if (!notifications.length) {
    const text = unreadOnly ? 'Everything here has been read.' : 'We will let you know when someone assigns you a task or comments on yours.';
    return (
      <div className="panel">
        <EmptyState icon="bell-off" title="You're all caught up." text={text} />
      </div>
    );
  }

  return (
    <>
      {[...byDay(notifications).entries()].map(([day, entries]) => (
        <section key={day} aria-label={day}>
          <h2 className="day-h">{day}</h2>
          <div className="panel" style={{ overflow: 'hidden' }}>
            {entries.map(notification => (
              <NotificationRow
                key={notification.id}
                notification={notification}
                actor={notification.actorId ? memberById.get(notification.actorId) : undefined}
                onOpen={onOpen}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
