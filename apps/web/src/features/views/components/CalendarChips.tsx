import type { Member, Task } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { PriorityIcon, StatusIcon } from '../../../shared/ui/vocab';

export interface ChipProps {
  task: Task;
  assignee?: Member;
}

export function MonthChip({ task, assignee }: ChipProps) {
  return (
    <button
      className={`cev ${task.status === 'done' ? 'done' : ''}`.trim()}
      type="button"
      style={{ ['--c' as string]: 'var(--gray)' }}
      draggable="true"
      title={task.title}
    >
      {task.status === 'done' ? <StatusIcon status="done" size={11} /> : <PriorityIcon priority={task.priority} size={11} />}
      <span className="trunc">{task.title}</span>
      <Avatar member={assignee} className="" tip={false} />
    </button>
  );
}

export function WeekChip({ task, assignee }: ChipProps) {
  return (
    <button className="wcard" type="button" style={{ ['--c' as string]: 'var(--gray)' }} draggable="true">
      <span className="t" style={task.status === 'done' ? { textDecoration: 'line-through', color: 'var(--text-3)' } : undefined}>
        <span className="pdot" style={{ ['--c' as string]: 'var(--gray)' }} />
        {task.title}
      </span>
      <span className="m">
        <StatusIcon status={task.status} size={11} />
        <PriorityIcon priority={task.priority} size={11} />
        <span className="trunc grow">{task.key}</span>
        <Avatar member={assignee} className="sm" tip={false} />
      </span>
    </button>
  );
}
