import type { FormEvent } from 'react';
import { Modal } from '../../../shared/ui/Modal';
import { showToast } from '../../../shared/ui/Toast';
import { useMembers } from '../../members/queries';
import type { TaskDefaults } from '../../views/view-model';
import { useCreateTask } from '../queries';
import { useTaskUi } from '../task-ui-store';
import { draftFrom, payloadOf, useTaskDraft } from '../use-task-draft';
import { TaskFields } from './TaskFields';

function ComposerForm({ defaults, onDone }: { defaults: TaskDefaults; onDone: () => void }) {
  const { draft, update } = useTaskDraft(draftFrom(defaults));
  const { data: members = [] } = useMembers();
  const create = useCreateTask();
  const canSubmit = Boolean(draft.title.trim()) && !create.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    create.mutate(payloadOf(draft), {
      onSuccess: task => {
        showToast(`${task.key} created`, 'success');
        onDone();
      },
      onError: () => showToast('Could not create the task', 'error'),
    });
  }

  return (
    <form className="col" style={{ gap: 14 }} onSubmit={submit}>
      <TaskFields draft={draft} members={members} onChange={update} autoFocus />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-secondary" type="button" onClick={onDone}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit" disabled={!canSubmit}>
          {create.isPending ? 'Creating…' : 'Create task'}
        </button>
      </div>
    </form>
  );
}

export function TaskComposer() {
  const defaults = useTaskUi(state => state.composer);
  const close = useTaskUi(state => state.closeComposer);

  return (
    <Modal open={defaults !== null} onClose={close} title="New task">
      {defaults && <ComposerForm defaults={defaults} onDone={close} />}
    </Modal>
  );
}
