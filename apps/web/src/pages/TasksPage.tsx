import { useState } from 'react';
import { Icon } from '../shared/ui/Icon';
import { Skeleton } from '../shared/ui/Skeleton';
import { PageHeader } from '../shared/ui/PageHeader';
import { Modal } from '../shared/ui/Modal';
import { showToast } from '../shared/ui/Toast';
import { useViewData } from '../features/views/use-view-data';
import type { Member, Task } from '@gr8r/domain';
import { searchTasks, type GroupBy } from '../features/views/view-model';
import { ViewModeSwitch } from '../features/views/components/ViewModeSwitch';
import { ViewToolbar } from '../features/views/components/ViewToolbar';
import { TaskForm } from '../features/tasks/components/TaskForm';
import { TaskTable } from '../features/tasks/components/TaskTable';
import { TaskDrawer } from '../features/tasks/components/TaskDrawer';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../shared/api/client';

const GROUP_LABELS: Record<GroupBy, string> = {
  status: 'Status',
  priority: 'Priority',
  assignee: 'Assignee',
  none: 'None',
};

function nextGroup(current: GroupBy): GroupBy {
  const order: GroupBy[] = ['status', 'priority', 'assignee', 'none'];
  return order[(order.indexOf(current) + 1) % order.length] ?? 'status';
}

function TasksBody({
  visible,
  members,
  isLoading,
  error,
  onOpen,
  onDelete,
}: {
  visible: Task[];
  members: Member[];
  isLoading: boolean;
  error: unknown;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  if (isLoading) return <Skeleton lines={8} />;
  if (error) return <p className="error">{(error as Error).message}</p>;
  return <TaskTable tasks={visible} members={members} onOpen={onOpen} onDelete={onDelete} />;
}

function TaskComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="New task">
      <TaskForm />
    </Modal>
  );
}

function TasksToolbar({ query, group, onQuery, onCycleGroup }: { query: string; group: GroupBy; onQuery: (v: string) => void; onCycleGroup: () => void }) {
  return (
    <ViewToolbar query={query} onQuery={onQuery} groupLabel={GROUP_LABELS[group]} onCycleGroup={onCycleGroup} right={<ViewModeSwitch active="/tasks" />} />
  );
}

function TasksHeader({ composerOpenSetter }: { composerOpenSetter: () => void }) {
  return (
    <PageHeader
      title="Tasks"
      subtitle="Every task across your workspace."
      action={
        <button className="btn btn-primary" type="button" onClick={composerOpenSetter}>
          <Icon name="plus" size={14} />
          New task
        </button>
      }
    />
  );
}

export function TasksPage() {
  const { tasks, members, isLoading, error } = useViewData();
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<GroupBy>('status');
  const [composerOpen, setComposerOpen] = useState(false);
  const [selected, setSelected] = useState<Task | null>(null);
  const client = useQueryClient();
  const visible = searchTasks(tasks, query);

  return (
    <div className="page flush">
      <TasksHeader composerOpenSetter={() => setComposerOpen(true)} />
      <TasksToolbar query={query} group={group} onQuery={setQuery} onCycleGroup={() => setGroup(nextGroup(group))} />
      <TasksBody
        visible={visible}
        members={members}
        isLoading={isLoading}
        error={error}
        onOpen={setSelected}
        onDelete={task => {
          apiFetch<void>(`/api/tasks/${task.id}`, { method: 'DELETE' })
            .then(() => {
              client.invalidateQueries({ queryKey: queryKeys.tasks() });
              showToast('Task deleted', 'success');
            })
            .catch(() => showToast('Failed to delete task', 'error'));
        }}
      />
      <TaskComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
      <TaskDrawer task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
