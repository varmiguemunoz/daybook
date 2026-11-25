import { Fragment, type ReactNode } from 'react';
import type { Member, Task } from '@daybook/domain';
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@daybook/domain';
import { Avatar } from '../../core/components/Avatar';
import { DueBadge, LabelChip, PriorityIcon, StatusIcon } from '../../core/components/vocab';
import { formatDate } from '../../core/utils/dates';
import { AssigneeMenu, DueMenu, PriorityMenu, StatusMenu } from '../../tasks/components/TaskMenus';

export interface CellContext {
  task: Task;
  assignee?: Member;
  members: Member[];
  selected: boolean;
  onSelect: () => void;
}

const CELLS: Record<string, (context: CellContext) => ReactNode> = {
  title: ({ task, selected, onSelect }) => (
    <td className="sticky cellbtn">
      <span className="row" style={{ gap: 8 }}>
        <input
          type="checkbox"
          className="check"
          aria-label={`Select ${task.title}`}
          checked={selected}
          onChange={onSelect}
          onClick={event => event.stopPropagation()}
        />
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
      <StatusMenu task={task}>
        <StatusIcon status={task.status} />
        <span>{TASK_STATUS_LABELS[task.status]}</span>
      </StatusMenu>
    </td>
  ),
  priority: ({ task }) => (
    <td className="cellbtn">
      <PriorityMenu task={task}>
        <PriorityIcon priority={task.priority} />
        <span>{PRIORITY_LABELS[task.priority]}</span>
      </PriorityMenu>
    </td>
  ),
  assignee: ({ task, assignee, members }) => (
    <td className="cellbtn">
      <AssigneeMenu task={task} members={members}>
        <Avatar member={assignee} className="sm" tip={false} />
        <span className={`trunc ${assignee ? '' : 'faint'}`.trim()}>{assignee?.name ?? 'Unassigned'}</span>
      </AssigneeMenu>
    </td>
  ),
  due: ({ task }) => (
    <td className="cellbtn num">
      <DueMenu task={task} className="pillbtn">
        {task.dueDate ? <DueBadge task={task} withIcon={false} /> : <span className="faint">—</span>}
      </DueMenu>
    </td>
  ),
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
