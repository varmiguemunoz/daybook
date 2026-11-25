import { Fragment, type ReactNode } from 'react';
import type { Member, Task } from '@gr8r/domain';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { DueBadge, LabelChip, PriorityIcon, StatusIcon } from '../../../shared/ui/vocab';
import { formatDate } from '../../../shared/dates';

export interface CellContext {
  task: Task;
  assignee?: Member;
}

const CELLS: Record<string, (context: CellContext) => ReactNode> = {
  title: ({ task }) => (
    <td className="sticky cellbtn">
      <span className="row" style={{ gap: 8 }}>
        <StatusIcon status={task.status} size={13} />
        <span className="trunc" style={{ fontWeight: 450 }}>
          {task.title}
        </span>
        <span className="mono faint" style={{ fontSize: 11, marginLeft: 'auto' }}>
          {task.key}
        </span>
      </span>
    </td>
  ),
  status: ({ task }) => (
    <td className="cellbtn">
      <span className="row" style={{ gap: 6 }}>
        <StatusIcon status={task.status} />
        <span>{TASK_STATUS_LABELS[task.status]}</span>
      </span>
    </td>
  ),
  priority: ({ task }) => (
    <td className="cellbtn">
      <span className="row" style={{ gap: 6 }}>
        <PriorityIcon priority={task.priority} />
        <span>{PRIORITY_LABELS[task.priority]}</span>
      </span>
    </td>
  ),
  assignee: ({ assignee }) => (
    <td className="cellbtn">
      <span className="row" style={{ gap: 6 }}>
        <Avatar member={assignee} className="sm" tip={false} />
        <span className={`trunc ${assignee ? '' : 'faint'}`.trim()}>{assignee?.name ?? 'Unassigned'}</span>
      </span>
    </td>
  ),
  due: ({ task }) => <td className="cellbtn num">{task.dueDate ? <DueBadge task={task} withIcon={false} /> : <span className="faint">—</span>}</td>,
  labels: ({ task }) => (
    <td className="cellbtn">
      <span className="row" style={{ gap: 4 }}>
        {task.labels.length ? task.labels.map(label => <LabelChip key={label} label={label} />) : <span className="faint">—</span>}
      </span>
    </td>
  ),
  estimate: ({ task }) => <td className="cellbtn num">{task.estimate ? task.estimate : <span className="faint">—</span>}</td>,
  created: ({ task }) => <td className="num muted">{formatDate(new Date(task.createdAt).toISOString().slice(0, 10))}</td>,
};

export function TaskCells({ columns, context }: { columns: string[]; context: CellContext }) {
  return (
    <>
      {columns.map(column => {
        const render = CELLS[column];
        return <Fragment key={column}>{render ? render(context) : null}</Fragment>;
      })}
    </>
  );
}
