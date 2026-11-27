import type { Activity, Member, Task } from '@daybook/domain';
import { Avatar } from '../../core/components/Avatar';
import { EmptyState } from '../../core/components/EmptyState';
import { timeAgo } from '../../core/utils/dates';
import type { HomeData } from '../lib/home-data';

interface EntryProps {
  entry: Activity;
  actor?: Member;
  task?: Task;
  meId: string;
}

function ActivityEntry({ entry, actor, task, meId }: EntryProps) {
  const subject = task?.title ?? entry.detail;

  return (
    <div className="fitem">
      <Avatar member={actor} className="sm" />
      <div className="grow">
        <b>{actor?.id === meId ? 'You' : (actor?.name ?? 'Someone')}</b>
        {entry.via === 'mcp' && <span className="muted"> via AI assistant</span>} <span className="muted">{entry.verb}</span>{' '}
        <span className="obj">{subject}</span>
      </div>
      <time>{timeAgo(entry.at)}</time>
    </div>
  );
}

export function RecentActivityPanel({ data }: { data: HomeData }) {
  const memberById = new Map(data.members.map(member => [member.id, member]));
  const taskById = new Map(data.tasks.map(task => [task.id, task]));

  return (
    <section className="panel">
      <div className="panel-h">
        <h2>Recent activity</h2>
        <div className="acts">
          <button className="btn btn-sm btn-ghost" type="button">
            View all
          </button>
        </div>
      </div>
      {data.activity.length === 0 && (
        <EmptyState icon="activity" title="No activity yet" text="Task changes from you and your team show up here." className="sm" />
      )}
      <div className="panel-b feed lined">
        {data.activity.slice(0, 7).map(entry => (
          <ActivityEntry
            key={entry.id}
            entry={entry}
            actor={entry.actorId ? memberById.get(entry.actorId) : undefined}
            task={entry.taskId ? taskById.get(entry.taskId) : undefined}
            meId={data.me.id}
          />
        ))}
      </div>
    </section>
  );
}
