import type { Activity, Member, Task } from '@daybook/domain';
import { EmptyState } from '../../core/components/EmptyState';
import { dayBucket } from '../../core/utils/dates';
import { ActivityList } from './ActivityList';

interface Props {
  activity: Activity[];
  members: Member[];
  tasks: Task[];
}

function groupByDay(entries: Activity[]): Array<[string, Activity[]]> {
  const groups = new Map<string, Activity[]>();
  for (const entry of entries) {
    const key = dayBucket(entry.at);
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.entries()];
}

export function ActivityFeedBody({ activity, members, tasks }: Props) {
  if (!activity.length) {
    return <EmptyState icon="activity" title="No activity yet" text="Changes to tasks and projects will appear here." />;
  }

  return (
    <>
      {groupByDay(activity).map(([day, entries]) => (
        <div key={day}>
          <div className="day-h">{day}</div>
          <ActivityList activity={entries} members={members} tasks={tasks} />
        </div>
      ))}
    </>
  );
}
