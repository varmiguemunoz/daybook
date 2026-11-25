import { useState } from 'react';
import type { Member } from '@gr8r/domain';
import { Skeleton } from '../shared/ui/Skeleton';
import { PageHeader } from '../shared/ui/PageHeader';
import { useViewData } from '../features/views/use-view-data';
import { searchTasks } from '../features/views/view-model';
import { ViewModeSwitch } from '../features/views/components/ViewModeSwitch';
import { ViewToolbar } from '../features/views/components/ViewToolbar';
import { Board } from '../features/views/components/Board';
import { TaskDrawer } from '../features/tasks/components/TaskDrawer';
import type { Task } from '@gr8r/domain';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, apiFetch } from '../shared/api/client';

export function BoardPage() {
  const { tasks, memberById, isLoading, error } = useViewData();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Task | null>(null);
  const visible = searchTasks(tasks, query);
  const memberMap: Map<string, Member> = memberById;
  const client = useQueryClient();

  return (
    <div className="page flush">
      <PageHeader title="Board" subtitle="Drag work across statuses to keep the flow moving." />
      <ViewToolbar query={query} onQuery={setQuery} right={<ViewModeSwitch active="/board" />} />
      {isLoading && <Skeleton lines={8} />}
      {error && <p className="error">{(error as Error).message}</p>}
      {!isLoading && !error && (
        <Board
          tasks={visible}
          members={memberMap}
          onAdd={() => undefined}
          onOpen={setSelected}
          onMove={(taskId, status) => {
            apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify({ status }) })
              .then(() => client.invalidateQueries({ queryKey: queryKeys.tasks() }))
              .catch(() => undefined);
          }}
        />
      )}
      <TaskDrawer task={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
