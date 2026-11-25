import { useState, type FormEvent } from 'react';
import type { Task } from '@daybook/domain';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { Drawer } from '../../core/components/Drawer';
import { Icon } from '../../core/components/Icon';
import { showToast } from '../../core/components/Toast';
import { useMembers } from '../../members/services/queries';
import { useDeleteTasks, useTasks, useUpdateTask } from '../services/queries';
import { useTaskUi } from '../states/task-ui-store';
import { draftFrom, payloadOf, useTaskDraft } from '../hooks/use-task-draft';
import { TaskComments } from './TaskComments';
import { TaskFields } from './TaskFields';

function useTaskEditor(task: Task, onClose: () => void) {
  const { draft, update } = useTaskDraft(draftFrom(task));
  const save = useUpdateTask();
  const remove = useDeleteTasks();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    save.mutate({ id: task.id, patch: payloadOf(draft) }, { onSuccess: () => showToast('Task updated', 'success') });
  }

  function destroy() {
    onClose();
    remove
      .mutateAsync([task.id])
      .then(() => showToast(`${task.key} deleted`, 'success'))
      .catch(() => undefined);
  }

  return { draft, update, submit, destroy, saving: save.isPending };
}

function TaskEditor({ task, onClose }: { task: Task; onClose: () => void }) {
  const { draft, update, submit, destroy, saving } = useTaskEditor(task, onClose);
  const { data: members = [] } = useMembers();
  const [confirming, setConfirming] = useState(false);

  return (
    <form className="col" style={{ gap: 14 }} onSubmit={submit}>
      <TaskFields draft={draft} members={members} onChange={update} />
      <div className="row" style={{ gap: 8 }}>
        <button className="btn btn-danger-ghost" type="button" onClick={() => setConfirming(true)}>
          <Icon name="trash-2" size={14} />
          Delete
        </button>
        <span className="sp" />
        <button className="btn btn-primary" type="submit" disabled={saving || !draft.title.trim()}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Delete task"
        message={`${task.key} "${task.title}" will be deleted. This cannot be undone.`}
        onConfirm={destroy}
        onClose={() => setConfirming(false)}
      />
    </form>
  );
}

export function TaskDrawer() {
  const taskId = useTaskUi(state => state.openTaskId);
  const close = useTaskUi(state => state.closeTask);
  const { data: tasks } = useTasks();
  const task = tasks?.find(item => item.id === taskId);

  if (!task) return null;

  return (
    <Drawer open title={task.key} onClose={close}>
      <TaskEditor key={task.id} task={task} onClose={close} />
      <TaskComments taskId={task.id} />
    </Drawer>
  );
}
