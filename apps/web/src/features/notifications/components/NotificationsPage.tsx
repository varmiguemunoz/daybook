import { Icon } from '../../../shared/ui/Icon';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { useActivity } from '../../activity/queries';
import { useMarkAllNotificationsRead } from '../../notifications/queries';
import { useMembers } from '../../members/queries';
import { useTasks } from '../../tasks/queries';
import { NotificationGroups } from './NotificationGroups';

export function NotificationsPage() {
  const { data: activity = [], isLoading } = useActivity(50);
  const markAll = useMarkAllNotificationsRead();
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="ph">
        <div>
          <h1>Notifications</h1>
          <p>Updates on tasks and projects you follow.</p>
        </div>
        <div className="acts">
          <div className="seg">
            <button type="button" className="on">
              All
            </button>
            <button type="button">Unread</button>
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <Icon name="check-check" size={14} />
            Mark all as read
          </button>
        </div>
      </div>
      {isLoading ? <Skeleton lines={6} /> : <NotificationGroups activity={activity} members={members} tasks={tasks} />}
    </div>
  );
}
