import { useState } from 'react';
import type { Priority, TaskStatus } from '@gr8r/domain';
import { useCreateTask } from '../queries';
import { TaskFormFields } from './TaskFormFields';
import { DatePicker } from '../../../shared/ui/DatePicker';

interface Props {
  projectId?: string | null;
  defaultStatus?: TaskStatus;
}

export function TaskForm({ projectId, defaultStatus = 'todo' }: Props) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<Priority>('none');
  const [dueDate, setDueDate] = useState('');
  const create = useCreateTask();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    await create.mutateAsync({ projectId: projectId ?? null, title: title.trim(), status, priority, dueDate: dueDate || null });
    setTitle('');
  }

  return (
    <form className="col" style={{ gap: 10 }} onSubmit={submit}>
      <input className="input" value={title} onChange={event => setTitle(event.target.value)} placeholder="Task title" aria-label="Task title" />
      <DatePicker value={dueDate} onChange={setDueDate} />
      <TaskFormFields status={status} priority={priority} pending={create.isPending} onStatus={setStatus} onPriority={setPriority} />
    </form>
  );
}
