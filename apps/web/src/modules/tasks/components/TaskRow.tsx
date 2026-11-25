import type { Member, Task } from '@daybook/domain';
import { Avatar } from '../../core/components/Avatar';
import { Icon } from '../../core/components/Icon';
import { PriorityPill, StatusPill } from '../../core/components/vocab';
import { isOverdue, relativeDate } from '../../core/utils/dates';
import { useTaskUi } from '../states/task-ui-store';
import { AssigneeMenu, DueMenu, PriorityMenu, StatusMenu } from './TaskMenus';

interface TaskRowProps {
  task: Task;
  assignee?: Member;
  members: Member[];
  template: string;
  selected: boolean;
  onSelect: () => void;
}

function dueClass(task: Task): string {
  if (!task.dueDate) return 'pillbtn empty';
  return isOverdue(task.dueDate, task.status) ? 'pillbtn over' : 'pillbtn';
}

function TaskRowCells({ task, assignee, members }: Pick<TaskRowProps, 'task' | 'assignee' | 'members'>) {
  return (
    <>
      <div className="c-meta c-status">
        <StatusMenu task={task}>
          <StatusPill status={task.status} />
        </StatusMenu>
      </div>
      <div className="c-meta c-assignee">
        <AssigneeMenu task={task} members={members} className={`pillbtn ${assignee ? '' : 'empty'}`.trim()}>
          <Avatar member={assignee} className="sm" tip={false} />
          <span className="trunc">{assignee ? assignee.name : 'Unassigned'}</span>
        </AssigneeMenu>
      </div>
      <div className="c-meta c-priority">
        <PriorityMenu task={task} className={`pillbtn ${task.priority === 'none' ? 'empty' : ''}`.trim()}>
          <PriorityPill priority={task.priority} />
        </PriorityMenu>
      </div>
      <div className="c-meta c-due">
        <DueMenu task={task} className={dueClass(task)}>
          <Icon name="calendar" size={13} />
          <span className={task.dueDate ? 'num' : ''}>{task.dueDate ? relativeDate(task.dueDate) : 'Set date'}</span>
        </DueMenu>
      </div>
    </>
  );
}

export function TaskRow({ task, assignee, members, template, selected, onSelect }: TaskRowProps) {
  const openTask = useTaskUi(state => state.openTask);

  return (
    <div
      className={`trow ${task.status === 'done' ? 'done' : ''} ${selected ? 'sel' : ''}`.trim()}
      style={{ ['--cols' as string]: template }}
      onClick={() => openTask(task.id)}
      onKeyDown={event => event.key === 'Enter' && event.target === event.currentTarget && openTask(task.id)}
      role="row"
      tabIndex={0}
    >
      <div className="c-check" onClick={event => event.stopPropagation()}>
        <input type="checkbox" className="check" aria-label={`Select ${task.title}`} checked={selected} onChange={onSelect} />
      </div>
      <div className="ttl">
        <span className="key">{task.key}</span>
        <span className="tt">{task.title}</span>
      </div>
      <TaskRowCells task={task} assignee={assignee} members={members} />
      <div className="c-more">
        <button
          className="ibtn ibtn-sm"
          type="button"
          aria-label={`Open ${task.key}`}
          onClick={event => {
            event.stopPropagation();
            openTask(task.id);
          }}
        >
          <Icon name="ellipsis" size={15} />
        </button>
      </div>
    </div>
  );
}
