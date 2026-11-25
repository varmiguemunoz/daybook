import { useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { PageHeader } from '../../../shared/ui/PageHeader';
import { useViewData } from '../use-view-data';
import { searchTasks, type GroupBy, type SortBy } from '../view-model';
import { ViewModeSwitch } from './ViewModeSwitch';
import { ViewToolbar } from './ViewToolbar';
import { Table } from './Table';
import { TaskDrawer } from '../../tasks/components/TaskDrawer';
import type { Task } from '@gr8r/domain';

const GROUP_LABELS: Record<GroupBy, string> = {
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  none: 'None',
};

const SORT_LABELS: Record<SortBy, string> = {
  manual: 'Manual',
  title: 'Title',
  due: 'Due date',
  priority: 'Priority',
  status: 'Status',
};

const GROUP_ORDER: GroupBy[] = ['status', 'priority', 'assignee', 'none'];
const SORT_ORDER: SortBy[] = ['manual', 'title', 'due', 'priority', 'status'];

function next<T>(order: T[], current: T): T {
  const index = order.indexOf(current);
  return order[(index + 1) % order.length] ?? order[0] ?? current;
}

export function TablePage() {
  const { tasks, memberById, isLoading, error } = useViewData();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GroupBy>('status');
  const [sort, setSort] = useState<SortBy>('manual');
  const [selected, setSelected] = useState<Task | null>(null);
  const visible = searchTasks(tasks, query);

  return (
    <div className="page flush">
      <PageHeader
        title="Table"
        subtitle="Every task in a sortable, grouped grid."
        action={
          <button className="btn btn-primary" type="button" onClick={() => undefined}>
            <Icon name="plus" size={14} />
            New task
          </button>
        }
      />
      <ViewToolbar
        query={query}
        onQuery={setQuery}
        sortLabel={SORT_LABELS[sort]}
        onCycleSort={() => setSort(next(SORT_ORDER, sort))}
        groupLabel={GROUP_LABELS[group]}
        onCycleGroup={() => setGroup(next(GROUP_ORDER, group))}
        right={<ViewModeSwitch active="/table" />}
      />
      {isLoading && <Skeleton lines={8} />}
      {error && <p className="error">{(error as Error).message}</p>}
      {!isLoading && !error && <Table tasks={visible} members={memberById} group={group} sort={sort} onOpen={setSelected} />}
      <TaskDrawer task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
