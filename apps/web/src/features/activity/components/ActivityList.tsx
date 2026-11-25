import type { Activity, Member, Task } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { timeAgo } from '../../../shared/dates';

interface EntryProps {
  entry: Activity;
  actor?: Member;
  task?: Task;
  meId?: string;
}

function actorName(actor: Member | undefined, meId?: string): string {
  if (actor?.id === meId) return 'You';
  return actor?.name ?? 'Someone';
}

function subjectOf(entry: Activity, task?: Task): string {
  if (task) return task.title;
  return entry.detail;
}



export function ActivityEntry({ entry, actor, task, meId }: EntryProps) {
  return (
    <div className="fitem">
      <Avatar member={actor} className="sm" />
      <div className="grow">
        <b>{actorName(actor, meId)}</b> <span className="muted">{entry.verb}</span> <span className="obj">{subjectOf(entry, task)}</span>
      </div>
      <time>{timeAgo(entry.at)}</time>
    </div>
  );
}

interface ListProps {
  activity: Activity[];
  members: Member[];
  tasks: Task[];
  meId?: string;
}

export function ActivityList({ activity, members, tasks, meId }: ListProps) {
  const memberById = new Map(members.map(member => [member.id, member]));
  const taskById = new Map(tasks.map(task => [task.id, task]));

  return (
    <div className="feed lined">
      {activity.map(entry => {
        const task = entry.taskId ? taskById.get(entry.taskId) : undefined;
        return (
          <ActivityEntry
            key={entry.id}
            entry={entry}
            actor={entry.actorId ? memberById.get(entry.actorId) : undefined}
            task={task}
            meId={meId}
          />
        );
      })}
    </div>
  );
}
