import type { Member, Task, TaskStatus } from '@gr8r/domain';
import { TASK_STATUS_LABELS, TASK_STATUSES } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { StatusIcon } from '../../../shared/ui/vocab';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { TaskRow } from './TaskRow';

const COLUMNS = ['status', 'assignee', 'priority', 'due'];
const COLUMN_LABELS: Record<string, [string, string]> = {
  status: ['Status', '126px'],
  assignee: ['Assignee', '150px'],
  priority: ['Priority', '108px'],
  due: ['Due date', '104px'],
};
const TEMPLATE = `18px 30px minmax(220px,1fr) ${COLUMNS.map(column => COLUMN_LABELS[column]?.[1] ?? '0px').join(' ')} 40px`;

interface TaskTableProps {
  tasks: Task[];
  members: Member[];
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskTable({ tasks, members, onOpen, onDelete }: TaskTableProps) {
  const memberById = new Map(members.map(member => [member.id, member]));

  if (!tasks.length) {
    return <EmptyState icon="list-checks" title="No tasks here" text="Add a task to get things moving." />;
  }

  return (
    <div className="tlist" role="table" aria-label="Tasks">
      <div className="thead" style={{ ['--cols' as string]: TEMPLATE }} role="row">
        <div />
        <div>
          <input type="checkbox" className="check" aria-label="Select all" />
        </div>
        <div>Task</div>
        {COLUMNS.map(column => (
          <div key={column}>{COLUMN_LABELS[column]?.[0] ?? column}</div>
        ))}
        <div />
      </div>
      {TASK_STATUSES.map(status => {
        const groupTasks = tasks.filter(task => task.status === status);
        return <TaskGroup key={status} status={status} tasks={groupTasks} memberById={memberById} onOpen={onOpen} onDelete={onDelete} />;
      })}
    </div>
  );
}

interface TaskGroupProps {
  status: TaskStatus;
  tasks: Task[];
  memberById: Map<string, Member>;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}

function TaskGroup({ status, tasks, memberById, onOpen, onDelete }: TaskGroupProps) {
  return (
    <>
      <div className="grp">
        <button className="ibtn ibtn-xs" type="button" aria-expanded="true" aria-label="Toggle group">
          <Icon name="chevron-down" size={13} />
        </button>
        <StatusIcon status={status} />
        <span>{TASK_STATUS_LABELS[status]}</span>
        <span className="cnt">{tasks.length}</span>
        <button className="ibtn ibtn-xs" type="button" aria-label={`Add task to ${TASK_STATUS_LABELS[status]}`}>
          <Icon name="plus" size={13} />
        </button>
      </div>
      {tasks.map(task => (
        <TaskRow
          key={task.id}
          task={task}
          assignee={task.assigneeId ? memberById.get(task.assigneeId) : undefined}
          columns={COLUMNS}
          template={TEMPLATE}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
      <button className="addrow" type="button">
        <Icon name="plus" size={14} />
        Add task
      </button>
    </>
  );
}
