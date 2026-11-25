import { useState } from 'react';
import { Skeleton } from '../modules/core/components/Skeleton';
import { PageHeader } from '../modules/core/components/PageHeader';
import type { GroupBy, SortBy } from '../modules/views/lib/view-model';
import { ViewModeSwitch } from '../modules/views/components/ViewModeSwitch';
import { ViewToolbar } from '../modules/views/components/ViewToolbar';
import { Table } from '../modules/views/components/Table';
import { useTaskView } from '../modules/tasks/hooks/use-task-view';
import { useTaskSelection } from '../modules/tasks/hooks/use-task-selection';
import { NewTaskButton } from '../modules/tasks/components/NewTaskButton';
import { TaskFilters } from '../modules/tasks/components/TaskFilters';
import { BulkActionsBar } from '../modules/tasks/components/BulkActionsBar';

const GROUP_LABELS: Record<GroupBy, string> = { status: 'Status', priority: 'Priority', assignee: 'Assignee', none: 'None' };
const SORT_LABELS: Record<SortBy, string> = { manual: 'Manual', title: 'Title', due: 'Due date', priority: 'Priority', status: 'Status' };
const GROUP_ORDER: GroupBy[] = ['status', 'priority', 'assignee', 'none'];
const SORT_ORDER: SortBy[] = ['manual', 'title', 'due', 'priority', 'status'];

function next<Value>(order: Value[], current: Value): Value {
  return order[(order.indexOf(current) + 1) % order.length] ?? current;
}

export function TablePage() {
  const view = useTaskView('table');
  const [group, setGroup] = useState<GroupBy>('status');
  const [sort, setSort] = useState<SortBy>('manual');
  const selection = useTaskSelection(view.tasks.map(task => task.id));

  return (
    <div className="page flush">
      <PageHeader title="Table" subtitle="Every task in a sortable, grouped grid." action={<NewTaskButton />} />
      <ViewToolbar
        query={view.query}
        onQuery={view.setQuery}
        filter={<TaskFilters filter={view.filter} members={view.members} onChange={view.setFilter} />}
        sortLabel={SORT_LABELS[sort]}
        onCycleSort={() => setSort(next(SORT_ORDER, sort))}
        groupLabel={GROUP_LABELS[group]}
        onCycleGroup={() => setGroup(next(GROUP_ORDER, group))}
        right={<ViewModeSwitch active="/table" />}
      />
      {view.isLoading && <Skeleton lines={8} />}
      {view.error && <p className="error">{view.error.message}</p>}
      {!view.isLoading && !view.error && (
        <Table tasks={view.tasks} members={view.members} memberById={view.memberById} group={group} sort={sort} selection={selection} />
      )}
      <BulkActionsBar ids={selection.selectedIds} members={view.members} onClear={selection.clear} />
    </div>
  );
}
