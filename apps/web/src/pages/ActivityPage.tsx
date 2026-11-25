import { useState } from 'react';
import type { Activity } from '@gr8r/domain';
import { Skeleton } from '../shared/ui/Skeleton';
import { useActivity } from '../features/activity/queries';
import { useMembers } from '../features/members/queries';
import { useTasks } from '../features/tasks/queries';
import { ActivityFilters, type ActivityFilter } from '../features/activity/components/ActivityFilters';
import { ActivityFeedBody } from '../features/activity/components/ActivityFeedBody';

function matches(entry: Activity, filter: ActivityFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'comments') return entry.verb.includes('comment');
  if (filter === 'status') return /moved|completed|reopened/.test(entry.verb);
  return entry.verb.includes('project') || entry.projectId !== null;
}

export function ActivityPage() {
  const { data: activity = [], isLoading } = useActivity(100);
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [who, setWho] = useState('all');
  const visible = activity.filter(entry => matches(entry, filter) && (who === 'all' || entry.actorId === who));

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="ph">
        <div>
          <h1>Activity</h1>
          <p>Everything that&apos;s changed across the workspace.</p>
        </div>
      </div>
      <ActivityFilters filter={filter} who={who} members={members} onFilter={setFilter} onWho={setWho} />
      {isLoading ? <Skeleton lines={8} /> : <ActivityFeedBody activity={visible} members={members} tasks={tasks} />}
    </div>
  );
}
