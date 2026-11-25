import type { Activity, Member, Task } from '@gr8r/domain';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { dayBucket } from '../../../shared/dates';
import { NotificationRow } from './NotificationRow';

interface Props {
  activity: Activity[];
  members: Member[];
  tasks: Task[];
}

export function NotificationGroups({ activity, members, tasks }: Props) {
  const memberById = new Map(members.map(member => [member.id, member]));
  const taskById = new Map(tasks.map(task => [task.id, task]));
  const buckets = new Map<string, Activity[]>();
  for (const entry of activity) {
    const key = dayBucket(entry.at);
    buckets.set(key, [...(buckets.get(key) ?? []), entry]);
  }

  if (!activity.length) {
    return (
      <div className="panel">
        <EmptyState icon="bell-off" title="You're all caught up." text="No new notifications. We'll let you know when something needs you." />
      </div>
    );
  }

  return (
    <>
      {[...buckets.entries()].map(([day, entries]) => (
        <div key={day}>
          <div className="day-h">{day}</div>
          <div className="panel" style={{ overflow: 'hidden' }}>
            {entries.map(entry => {
              const task = entry.taskId ? taskById.get(entry.taskId) : undefined;
              return (
                <NotificationRow
                  key={entry.id}
                  entry={entry}
                  actor={entry.actorId ? memberById.get(entry.actorId) : undefined}
                  task={task}
                />
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
