import type { Priority, TaskStatus } from '@gr8r/domain';
import { PRIORITIES, PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from '@gr8r/domain';

interface FieldsProps {
  status: TaskStatus;
  priority: Priority;
  pending: boolean;
  onStatus: (status: TaskStatus) => void;
  onPriority: (priority: Priority) => void;
}

export function TaskFormFields({ status, priority, pending, onStatus, onPriority }: FieldsProps) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <select className="select" value={status} onChange={event => onStatus(event.target.value as TaskStatus)} aria-label="Status">
        {TASK_STATUSES.map(value => (
          <option key={value} value={value}>
            {TASK_STATUS_LABELS[value]}
          </option>
        ))}
      </select>
      <select className="select" value={priority} onChange={event => onPriority(event.target.value as Priority)} aria-label="Priority">
        {PRIORITIES.map(value => (
          <option key={value} value={value}>
            {PRIORITY_LABELS[value]}
          </option>
        ))}
      </select>
      <span className="sp" />
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add task'}
      </button>
    </div>
  );
}
