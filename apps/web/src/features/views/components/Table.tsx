import { Fragment } from 'react';
import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { TaskCells } from './TableCells';
import { groupTasks, sortTasks, type GroupBy, type SortBy, type TaskGroup } from '../view-model';

export interface TableColumn {
  id: string;
  label: string;
  width: number;
}

export const TABLE_COLUMNS: TableColumn[] = [
  { id: 'title', label: 'Task', width: 314 },
  { id: 'status', label: 'Status', width: 132 },
  { id: 'priority', label: 'Priority', width: 112 },
  { id: 'assignee', label: 'Assignee', width: 156 },
  { id: 'due', label: 'Due date', width: 112 },
  { id: 'labels', label: 'Labels', width: 180 },
  { id: 'estimate', label: 'Estimate', width: 92 },
];

interface Props {
  tasks: Task[];
  members: Map<string, Member>;
  group: GroupBy;
  sort: SortBy;
  onOpen: (task: Task) => void;
}

function TableHead() {
  return (
    <thead>
      <tr>
        {TABLE_COLUMNS.map(column => (
          <th key={column.id} className={column.id === 'title' ? 'sticky' : ''} scope="col" style={{ width: column.width }}>
            <div className="thi">{column.label}</div>
            <span className="rsz" aria-hidden="true" />
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TaskRow({ task, members, onOpen }: { task: Task } & Pick<Props, 'members' | 'onOpen'>) {
  return (
    <tr data-id={task.id} onClick={() => onOpen(task)} style={{ cursor: 'pointer' }}>
      <TaskCells
        columns={TABLE_COLUMNS.map(column => column.id)}
        context={{
          task,
          assignee: task.assigneeId ? members.get(task.assigneeId) : undefined,
        }}
      />
    </tr>
  );
}

function GroupHeading({ name, count }: { name: string; count: number }) {
  return (
    <tr className="grow-row">
      <td className="sticky" colSpan={TABLE_COLUMNS.length}>
        <span className="row" style={{ gap: 6 }}>
          {name}
          <span className="faint" style={{ fontWeight: 500 }}>
            {count}
          </span>
        </span>
      </td>
    </tr>
  );
}

function TableBody({ groups, group, members, onOpen }: { groups: TaskGroup[]; group: GroupBy } & Pick<Props, 'members' | 'onOpen'>) {
  return (
    <tbody>
      {groups.map(entry => (
        <Fragment key={entry.key}>
          {group !== 'none' && <GroupHeading name={entry.name} count={entry.tasks.length} />}
          {entry.tasks.map(task => (
            <TaskRow key={task.id} task={task} members={members} onOpen={onOpen} />
          ))}
        </Fragment>
      ))}
      <tr>
        <td className="sticky cellbtn" colSpan={TABLE_COLUMNS.length} style={{ color: 'var(--text-3)' }}>
          <span className="row" style={{ gap: 6 }}>
            <Icon name="plus" size={14} />
            New task
          </span>
        </td>
      </tr>
    </tbody>
  );
}

export function Table({ tasks, members, group, sort, onOpen }: Props) {
  if (!tasks.length) {
    return <EmptyState icon="search-x" title="No results found" text="No tasks match these filters." />;
  }

  const ordered = sortTasks(tasks, sort);
  const groups = groupTasks(ordered, group, [...members.values()]);
  const totalWidth = TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);

  return (
    <div className="tbl-wrap hide-m">
      <table className="tbl" style={{ width: totalWidth }} aria-label="Tasks table">
        <colgroup>
          {TABLE_COLUMNS.map(column => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <TableHead />
        <TableBody groups={groups} group={group} members={members} onOpen={onOpen} />
      </table>
    </div>
  );
}
