import { useState } from 'react';
import type { Member, Priority, Task, TaskStatus } from '@daybook/domain';
import { Avatar } from '../../core/components/Avatar';
import { EmptyState } from '../../core/components/EmptyState';
import { Icon } from '../../core/components/Icon';
import { PriorityIcon, StatusIcon } from '../../core/components/vocab';
import { groupDefaults, groupTasks, type GroupBy, type TaskGroup } from '../../views/lib/view-model';
import { useTaskUi } from '../states/task-ui-store';
import type { useTaskSelection } from '../hooks/use-task-selection';
import { TaskRow } from './TaskRow';

type Selection = ReturnType<typeof useTaskSelection>;

const TEMPLATE = '30px minmax(220px,1fr) 126px 150px 108px 104px 40px';
const COLUMN_LABELS = ['Status', 'Assignee', 'Priority', 'Due date'];

interface Props {
  tasks: Task[];
  members: Member[];
  memberById: Map<string, Member>;
  group: GroupBy;
  selection: Selection;
}

function GroupIcon({ group, entry, memberById }: { group: GroupBy; entry: TaskGroup; memberById: Map<string, Member> }) {
  if (group === 'status') return <StatusIcon status={entry.key as TaskStatus} />;
  if (group === 'priority') return <PriorityIcon priority={entry.key as Priority} />;
  if (group === 'assignee') return <Avatar member={memberById.get(entry.key)} className="sm" tip={false} />;
  return null;
}

function GroupHeader({
  group,
  entry,
  collapsed,
  memberById,
  onToggle,
}: {
  group: GroupBy;
  entry: TaskGroup;
  collapsed: boolean;
  memberById: Map<string, Member>;
  onToggle: () => void;
}) {
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <div className="grp">
      <button
        className="ibtn ibtn-xs"
        type="button"
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${entry.name}`}
        onClick={onToggle}
      >
        <Icon name={collapsed ? 'chevron-right' : 'chevron-down'} size={13} />
      </button>
      <GroupIcon group={group} entry={entry} memberById={memberById} />
      <span>{entry.name}</span>
      <span className="cnt">{entry.tasks.length}</span>
      <button className="ibtn ibtn-xs" type="button" aria-label={`Add task to ${entry.name}`} onClick={() => openComposer(groupDefaults(group, entry.key))}>
        <Icon name="plus" size={13} />
      </button>
    </div>
  );
}

function GroupRows({ group, entry, members, memberById, selection }: Omit<Props, 'tasks'> & { entry: TaskGroup }) {
  const [collapsed, setCollapsed] = useState(false);
  const openComposer = useTaskUi(state => state.openComposer);

  return (
    <>
      <GroupHeader group={group} entry={entry} collapsed={collapsed} memberById={memberById} onToggle={() => setCollapsed(!collapsed)} />
      {!collapsed &&
        entry.tasks.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            assignee={task.assigneeId ? memberById.get(task.assigneeId) : undefined}
            members={members}
            template={TEMPLATE}
            selected={selection.isSelected(task.id)}
            onSelect={() => selection.toggle(task.id)}
          />
        ))}
      {!collapsed && (
        <button className="addrow" type="button" onClick={() => openComposer(groupDefaults(group, entry.key))}>
          <Icon name="plus" size={14} />
          Add task
        </button>
      )}
    </>
  );
}

export function TaskTable({ tasks, members, memberById, group, selection }: Props) {
  if (!tasks.length) return <EmptyState icon="list-checks" title="No tasks here" text="Create a task or adjust the search and filters." />;

  return (
    <div className="tlist" role="table" aria-label="Tasks">
      <div className="thead" style={{ ['--cols' as string]: TEMPLATE }} role="row">
        <div>
          <input type="checkbox" className="check" aria-label="Select all tasks" checked={selection.allSelected} onChange={selection.toggleAll} />
        </div>
        <div>Task</div>
        {COLUMN_LABELS.map(label => (
          <div key={label}>{label}</div>
        ))}
        <div />
      </div>
      {groupTasks(tasks, group, members).map(entry => (
        <GroupRows key={entry.key} group={group} entry={entry} members={members} memberById={memberById} selection={selection} />
      ))}
    </div>
  );
}
