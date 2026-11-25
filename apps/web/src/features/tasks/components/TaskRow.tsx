import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { Avatar } from '../../../shared/ui/Avatar';
import { PriorityPill, StatusPill } from '../../../shared/ui/vocab';
import { isOverdue, relativeDate } from '../../../shared/dates';

interface TaskRowProps {
  task: Task;
  assignee?: Member;
  columns: string[];
  template: string;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function StatusCell({ task }: { task: Task }) {
  return (
    <div className="c-meta c-status">
      <button className="pillbtn" type="button" aria-label={`Status: ${task.status}`}>
        <StatusPill status={task.status} />
      </button>
    </div>
  );
}

function AssigneeCell({ assignee }: Pick<TaskRowProps, 'assignee'>) {
  return (
    <div className="c-meta c-assignee">
      <button className={`pillbtn ${assignee ? '' : 'empty'}`.trim()} type="button" aria-label="Assignee">
        <Avatar member={assignee} className="sm" tip={false} />
        <span className="trunc">{assignee ? assignee.name : 'Unassigned'}</span>
      </button>
    </div>
  );
}

function PriorityCell({ task }: { task: Task }) {
  return (
    <div className="c-meta c-priority">
      <button className={`pillbtn ${task.priority === 'none' ? 'empty' : ''}`.trim()} type="button" aria-label="Priority">
        <PriorityPill priority={task.priority} />
      </button>
    </div>
  );
}

function DueCell({ task }: { task: Task }) {
  const over = isOverdue(task.dueDate, task.status);

  return (
    <div className="c-meta c-due">
      <button className={`pillbtn ${task.dueDate ? (over ? 'over' : '') : 'empty'}`.trim()} type="button" aria-label="Due date">
        <Icon name="calendar" size={13} />
        <span className={task.dueDate ? 'num' : ''}>{task.dueDate ? relativeDate(task.dueDate) : 'Set date'}</span>
      </button>
    </div>
  );
}

export function TaskRow({ task, assignee, columns, template, onOpen, onDelete }: TaskRowProps) {
  return (
    <div className={`trow ${task.status === 'done' ? 'done' : ''}`.trim()} style={{ ['--cols' as string]: template }} data-task-row={task.id} onClick={() => onOpen(task)} role="button" tabIndex={0}>
      <div className="handle" draggable aria-hidden="true">
        <Icon name="grip-vertical" size={14} />
      </div>
      <div className="c-check">
        <input type="checkbox" className="check" aria-label={`Select ${task.title}`} />
      </div>
      <div className="ttl">
        <span className="key">{task.key}</span>
        <span className="tt">{task.title}</span>
      </div>
      {columns.includes('status') && <StatusCell task={task} />}
      {columns.includes('assignee') && <AssigneeCell assignee={assignee} />}
      {columns.includes('priority') && <PriorityCell task={task} />}
      {columns.includes('due') && <DueCell task={task} />}
      <div className="c-more">
        <button
          className="ibtn ibtn-sm"
          type="button"
          aria-label="More actions"
          onClick={event => {
            event.stopPropagation();
            if (window.confirm(`Delete ${task.key}?`)) onDelete(task);
          }}
        >
          <Icon name="ellipsis" size={15} />
        </button>
      </div>
    </div>
  );
}
