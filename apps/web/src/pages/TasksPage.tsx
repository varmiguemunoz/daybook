import { useState } from 'react';
import { Skeleton } from '../shared/ui/Skeleton';
import { PageHeader } from '../shared/ui/PageHeader';
import type { GroupBy } from '../features/views/view-model';
import { ViewModeSwitch } from '../features/views/components/ViewModeSwitch';
import { ViewToolbar } from '../features/views/components/ViewToolbar';
import { useTaskView } from '../features/tasks/use-task-view';
import { useTaskSelection } from '../features/tasks/use-task-selection';
import { NewTaskButton } from '../features/tasks/components/NewTaskButton';
import { TaskFilters } from '../features/tasks/components/TaskFilters';
import { TaskTable } from '../features/tasks/components/TaskTable';
import { BulkActionsBar } from '../features/tasks/components/BulkActionsBar';

const GROUP_LABELS: Record<GroupBy, string> = { status: 'Status', priority: 'Priority', assignee: 'Assignee', none: 'None' };
const GROUP_ORDER: GroupBy[] = ['status', 'priority', 'assignee', 'none'];

export function TasksPage() {
  const view = useTaskView('tasks');
  const [group, setGroup] = useState<GroupBy>('status');
  const selection = useTaskSelection(view.tasks.map(task => task.id));
  const nextGroup = GROUP_ORDER[(GROUP_ORDER.indexOf(group) + 1) % GROUP_ORDER.length] ?? 'status';

  return (
    <div className="page flush">
      <PageHeader title="Tasks" subtitle="Every task across your workspace." action={<NewTaskButton />} />
      <ViewToolbar
        query={view.query}
        onQuery={view.setQuery}
        filter={<TaskFilters filter={view.filter} members={view.members} onChange={view.setFilter} />}
        groupLabel={GROUP_LABELS[group]}
        onCycleGroup={() => setGroup(nextGroup)}
        right={<ViewModeSwitch active="/tasks" />}
      />
      {view.isLoading && <Skeleton lines={8} />}
      {view.error && <p className="error">{view.error.message}</p>}
      {!view.isLoading && !view.error && (
        <TaskTable tasks={view.tasks} members={view.members} memberById={view.memberById} group={group} selection={selection} />
      )}
      <BulkActionsBar ids={selection.selectedIds} members={view.members} onClear={selection.clear} />
    </div>
  );
}
