import { lazy, Suspense } from 'react';
import { useTaskUi } from '../../modules/tasks/states/task-ui-store';

const TaskComposer = lazy(() => import('../../modules/tasks/components/TaskComposer').then(module => ({ default: module.TaskComposer })));
const TaskDrawer = lazy(() => import('../../modules/tasks/components/TaskDrawer').then(module => ({ default: module.TaskDrawer })));

export function TaskOverlays() {
  const composerOpen = useTaskUi(state => state.composer !== null);
  const taskOpen = useTaskUi(state => state.openTaskId !== null);

  return (
    <Suspense fallback={null}>
      {composerOpen && <TaskComposer />}
      {taskOpen && <TaskDrawer />}
    </Suspense>
  );
}
