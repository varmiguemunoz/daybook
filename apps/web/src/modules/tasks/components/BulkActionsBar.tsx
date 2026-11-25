import { useState } from 'react';
import type { BulkTaskPatch, Member } from '@daybook/domain';
import { ConfirmDialog } from '../../core/components/ConfirmDialog';
import { Icon } from '../../core/components/Icon';
import { OptionMenu } from '../../core/components/OptionMenu';
import { showToast } from '../../core/components/Toast';
import { UNASSIGNED } from '../../views/lib/view-model';
import { useDeleteTasks, useUpdateTasks } from '../services/queries';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeOptions } from './task-options';

interface Props {
  ids: string[];
  members: Member[];
  onClear: () => void;
}

function plural(count: number): string {
  return `${count} ${count === 1 ? 'task' : 'tasks'}`;
}

function useBulkActions(ids: string[], onClear: () => void) {
  const update = useUpdateTasks();
  const remove = useDeleteTasks();

  function apply(patch: BulkTaskPatch) {
    update
      .mutateAsync({ ids, patch })
      .then(() => showToast(`${plural(ids.length)} updated`, 'success'))
      .catch(() => undefined);
  }

  function destroy() {
    const count = ids.length;
    onClear();
    remove
      .mutateAsync(ids)
      .then(() => showToast(`${plural(count)} deleted`, 'success'))
      .catch(() => undefined);
  }

  return { apply, destroy };
}

function BulkFieldMenus({ members, onApply }: { members: Member[]; onApply: (patch: BulkTaskPatch) => void }) {
  return (
    <>
      <OptionMenu label="Set status" options={STATUS_OPTIONS} onSelect={status => onApply({ status })} className="btn btn-sm">
        <Icon name="circle-dot" size={14} />
        Status
      </OptionMenu>
      <OptionMenu label="Set priority" options={PRIORITY_OPTIONS} onSelect={priority => onApply({ priority })} className="btn btn-sm">
        <Icon name="flag" size={14} />
        Priority
      </OptionMenu>
      <OptionMenu
        label="Assign"
        options={assigneeOptions(members)}
        onSelect={id => onApply({ assigneeId: id === UNASSIGNED ? null : id })}
        className="btn btn-sm"
      >
        <Icon name="user-round" size={14} />
        Assign
      </OptionMenu>
    </>
  );
}

export function BulkActionsBar({ ids, members, onClear }: Props) {
  const { apply, destroy } = useBulkActions(ids, onClear);
  const [confirming, setConfirming] = useState(false);

  if (!ids.length) return null;

  return (
    <div className="bulkbar enter" role="toolbar" aria-label="Bulk actions">
      <span className="num">{ids.length} selected</span>
      <span className="sep" />
      <BulkFieldMenus members={members} onApply={apply} />
      <span className="sep" />
      <button className="btn btn-sm" type="button" onClick={() => setConfirming(true)}>
        <Icon name="trash-2" size={14} />
        Delete
      </button>
      <button className="btn btn-sm" type="button" onClick={onClear} aria-label="Clear selection">
        <Icon name="x" size={14} />
      </button>
      <ConfirmDialog
        open={confirming}
        title={`Delete ${plural(ids.length)}`}
        message={`${plural(ids.length)} will be deleted. This cannot be undone.`}
        onConfirm={() => {
          setConfirming(false);
          destroy();
        }}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
