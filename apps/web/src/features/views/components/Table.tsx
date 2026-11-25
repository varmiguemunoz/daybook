import { Fragment } from 'react';
import type { Member, Task } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { TaskCells } from './TableCells';
import { groupDefaults, groupTasks, sortTasks, type GroupBy, type SortBy, type TaskGroup } from '../view-model';
import { useTaskUi } from '../../tasks/task-ui-store';
import type { useTaskSelection } from '../../tasks/use-task-selection';

export interface TableColumn {
  id: string;
  label: string;
  width: number;
}

export const TABLE_COLUMNS: TableColumn[] = [
  { id: 'title', label: 'Task', width: 340 },
  { id: 'status', label: 'Status', width: 132 },
  { id: 'priority', label: 'Priority', width: 112 },
  { id: 'assignee', label: 'Assignee', width: 156 },
  { id: 'due', label: 'Due date', width: 112 },
  { id: 'labels', label: 'Labels', width: 180 },
  { id: 'estimate', label: 'Estimate', width: 92 },
];

const COLUMN_IDS = TABLE_COLUMNS.map(column => column.id);

interface Props {
  tasks: Task[];
  members: Member[];
  memberById: Map<string, Member>;
  group: GroupBy;
  sort: SortBy;
  selection: ReturnType<typeof useTaskSelection>;
}

function TableHead({ selection }: Pick<Props, 'selection'>) {
  return (
    <thead>
      <tr>
        {TABLE_COLUMNS.map(column => (
          <th key={column.id} className={column.id === 'title' ? 'sticky' : ''} scope="col" style={{ width: column.width }}>
            <div className="thi">
              {column.id === 'title' && (
                <input type="checkbox" className="check" aria-label="Select all tasks" checked={selection.allSelected} onChange={selection.toggleAll} />
              )}
              {column.label}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function GroupHeading({ group, entry }: { group: GroupBy; entry: TaskGroup }) {
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <tr className="grow-row">
      <td className="sticky" colSpan={TABLE_COLUMNS.length}>
        <span className="row" style={{ gap: 6 }}>
          {entry.name}
          <span className="faint" style={{ fontWeight: 500 }}>
            {entry.tasks.length}
          </span>
          <button className="ibtn ibtn-xs" type="button" aria-label={`Add task to ${entry.name}`} onClick={() => openComposer(groupDefaults(group, entry.key))}>
            <Icon name="plus" size={13} />
          </button>
        </span>
      </td>
    </tr>
  );
}

function TableBody({ groups, group, members, memberById, selection }: { groups: TaskGroup[] } & Omit<Props, 'tasks' | 'sort'>) {
  const openTask = useTaskUi(state => state.openTask);
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <tbody>
      {groups.map(entry => (
        <Fragment key={entry.key}>
          {group !== 'none' && <GroupHeading group={group} entry={entry} />}
          {entry.tasks.map(task => (
            <tr key={task.id} className={selection.isSelected(task.id) ? 'sel' : ''} onClick={() => openTask(task.id)} style={{ cursor: 'pointer' }}>
              <TaskCells
                columns={COLUMN_IDS}
                context={{
                  task,
                  assignee: task.assigneeId ? memberById.get(task.assigneeId) : undefined,
                  members,
                  selected: selection.isSelected(task.id),
                  onSelect: () => selection.toggle(task.id),
                }}
              />
            </tr>
          ))}
        </Fragment>
      ))}
      <tr>
        <td className="sticky" colSpan={TABLE_COLUMNS.length}>
          <button className="addrow" type="button" onClick={() => openComposer()}>
            <Icon name="plus" size={14} />
            New task
          </button>
        </td>
      </tr>
    </tbody>
  );
}

export function Table({ tasks, members, memberById, group, sort, selection }: Props) {
  if (!tasks.length) return <EmptyState icon="search-x" title="No tasks found" text="Create a task or adjust the search and filters." />;

  const groups = groupTasks(sortTasks(tasks, sort), group, members);
  const totalWidth = TABLE_COLUMNS.reduce((sum, column) => sum + column.width, 0);

  return (
    <div className="tbl-wrap hide-m">
      <table className="tbl" style={{ width: totalWidth }} aria-label="Tasks table">
        <colgroup>
          {TABLE_COLUMNS.map(column => (
            <col key={column.id} style={{ width: column.width }} />
          ))}
        </colgroup>
        <TableHead selection={selection} />
        <TableBody groups={groups} group={group} members={members} memberById={memberById} selection={selection} />
      </table>
    </div>
  );
}
