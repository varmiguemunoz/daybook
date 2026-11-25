import type { Activity, Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { timeAgo } from '../../../shared/dates';

const VERB_ICON: Record<string, string> = {
  created: 'plus',
  updated: 'pencil',
  completed: 'circle-check',
  reopened: 'rotate-ccw',
  archived: 'archive',
  commented: 'message-square',
  assigned: 'user',
  moved: 'arrow-right-left',
  deleted: 'trash-2',
};

interface Props {
  entry: Activity;
  actor?: Member;
  task?: Task;
}

function subject(entry: Activity, task?: Task): string {
  if (task) return task.title;
  return entry.detail;
}

export function NotificationRow({ entry, actor, task }: Props) {
  return (
    <div className="nrow" role="button" tabIndex={0}>
      <span className="picon" style={{ ['--c' as string]: 'var(--gray)' }}>
        <Icon name={VERB_ICON[entry.verb] ?? 'activity'} size={14} />
      </span>
      <div className="grow" style={{ fontSize: 13 }}>
        <div>
          <b>{actor?.name ?? 'Someone'}</b> <span className="muted">{entry.verb}</span> <span className="obj">{subject(entry, task)}</span>
        </div>
        {entry.detail ? (
          <div className="muted trunc" style={{ fontSize: 12.5, marginTop: 2 }}>
            {entry.detail}
          </div>
        ) : null}
        <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
          Workspace · {timeAgo(entry.at)}
        </div>
      </div>
    </div>
  );
}
