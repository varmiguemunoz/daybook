import type { FormEvent } from 'react';
import { Modal } from '../../core/components/Modal';
import { showToast } from '../../core/components/Toast';
import { failureMessage } from '../../core/services/api-client';
import { useMembers } from '../../members/services/queries';
import type { TaskDefaults } from '../../views/lib/view-model';
import { useCreateTask } from '../services/queries';
import { useTaskUi } from '../states/task-ui-store';
import { draftFrom, payloadOf, useTaskDraft } from '../hooks/use-task-draft';
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
      onError: error => showToast(failureMessage(error, 'Could not create the task'), 'error'),
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
