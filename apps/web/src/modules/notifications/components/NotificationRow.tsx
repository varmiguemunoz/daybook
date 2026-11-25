import type { Member, Notification } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { timeAgo } from '../../core/utils/dates';

const TYPE_ICON: Record<Notification['type'], string> = {
  mention: 'at-sign',
  assign: 'user',
  comment: 'message-square',
  update: 'pencil',
};

interface Props {
  notification: Notification;
  actor?: Member;
  onOpen: (notification: Notification) => void;
}

export function NotificationRow({ notification, actor, onOpen }: Props) {
  return (
    <button type="button" className={`nrow ${notification.read ? '' : 'unread'}`.trim()} onClick={() => onOpen(notification)}>
      <span className="picon" style={{ ['--c' as string]: 'var(--gray)' }}>
        <Icon name={TYPE_ICON[notification.type]} size={14} />
      </span>
      <span className="grow nrow-body">
        <span>
          <b>{actor?.name ?? 'Someone'}</b> <span className="muted">· {notification.text}</span>
        </span>
        {notification.snippet && <span className="muted trunc nrow-snippet">{notification.snippet}</span>}
        <span className="faint nrow-time">{timeAgo(notification.at)}</span>
      </span>
      {!notification.read && <span className="nrow-dot" aria-label="Unread" />}
    </button>
  );
}
