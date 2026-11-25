import { Skeleton } from '../modules/core/components/Skeleton';
import { PageHeader } from '../modules/core/components/PageHeader';
import { ViewModeSwitch } from '../modules/views/components/ViewModeSwitch';
import { ViewToolbar } from '../modules/views/components/ViewToolbar';
import { Board } from '../modules/views/components/Board';
import { useTaskView } from '../modules/tasks/hooks/use-task-view';
import { NewTaskButton } from '../modules/tasks/components/NewTaskButton';
import { TaskFilters } from '../modules/tasks/components/TaskFilters';

export function BoardPage() {
  const view = useTaskView('board');

  return (
    <div className="page flush">
      <PageHeader title="Board" subtitle="Drag work across statuses to keep the flow moving." action={<NewTaskButton />} />
      <ViewToolbar
        query={view.query}
        onQuery={view.setQuery}
        filter={<TaskFilters filter={view.filter} members={view.members} onChange={view.setFilter} />}
        right={<ViewModeSwitch active="/board" />}
      />
      {view.isLoading && <Skeleton lines={8} />}
      {view.error && <p className="error">{view.error.message}</p>}
      {!view.isLoading && !view.error && <Board tasks={view.tasks} members={view.members} memberById={view.memberById} />}
    </div>
  );
}
