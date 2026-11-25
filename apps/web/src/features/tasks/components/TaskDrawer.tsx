import { useState } from 'react';
import type { Member, Task } from '@gr8r/domain';
import { Drawer } from '../../../shared/ui/Drawer';
import { useUpdateTask } from '../queries';
import { useMembers } from '../../members/queries';
import { TaskFormFields } from './TaskFormFields';
import { DatePicker } from '../../../shared/ui/DatePicker';
import { TaskComments } from './TaskComments';
import { showToast } from '../../../shared/ui/Toast';

interface Props {
  task: Task | null;
  onClose: () => void;
}

function TaskEditForm({ task, members, onSave, pending }: {
  task: Task;
  members: Member[];
  onSave: (patch: { title: string; status: Task['status']; priority: Task['priority']; dueDate: string; assigneeId: string | null }) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState(task.title);
  const [status, setStatus] = useState<Task['status']>(task.status);
  const [priority, setPriority] = useState<Task['priority']>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId);

  return (
    <div className="col" style={{ gap: 12 }}>
      <input className="input" value={title} onChange={event => setTitle(event.target.value)} aria-label="Title" />
      <TaskFormFields status={status} priority={priority} pending={false} onStatus={setStatus} onPriority={setPriority} />
      <DatePicker value={dueDate} onChange={setDueDate} />
      <select className="select" value={assigneeId ?? ''} onChange={event => setAssigneeId(event.target.value || null)} aria-label="Assignee">
        <option value="">Unassigned</option>
        {members.map(member => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <button
        className="btn btn-primary"
        type="button"
        onClick={() => onSave({ title, status, priority, dueDate, assigneeId })}
        disabled={pending}
      >
        {pending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

export function TaskDrawer({ task, onClose }: Props) {
  const { data: members = [] } = useMembers();
  const update = useUpdateTask(task?.id ?? '');

  async function save(patch: { title: string; status: Task['status']; priority: Task['priority']; dueDate: string; assigneeId: string | null }) {
    if (!task) return;
    try {
      await update.mutateAsync({ ...patch, dueDate: patch.dueDate || null });
      showToast('Task updated', 'success');
    } catch {
      showToast('Failed to update task', 'error');
    }
  }

  if (!task) return null;

  return (
    <Drawer open={true} title={task.key} onClose={onClose}>
      <TaskEditForm task={task} members={members} onSave={save} pending={update.isPending} />
      <TaskComments taskId={task.id} />
    </Drawer>
  );
}
