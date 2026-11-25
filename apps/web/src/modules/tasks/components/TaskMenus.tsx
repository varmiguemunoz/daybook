import type { ReactNode } from 'react';
import type { Member, Task } from '@daybook/domain';
import { OptionMenu } from '../../core/components/OptionMenu';
import { DatePicker } from '../../core/components/DatePicker';
import { UNASSIGNED } from '../../views/lib/view-model';
import { useUpdateTask } from '../services/queries';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeOptions } from './task-options';

interface MenuProps {
  task: Task;
  className?: string;
  children: ReactNode;
}

export function StatusMenu({ task, className, children }: MenuProps) {
  const update = useUpdateTask();
  return (
    <OptionMenu
      label="Change status"
      value={task.status}
      options={STATUS_OPTIONS}
      onSelect={status => update.mutate({ id: task.id, patch: { status } })}
      className={className}
    >
      {children}
    </OptionMenu>
  );
}

export function PriorityMenu({ task, className, children }: MenuProps) {
  const update = useUpdateTask();
  return (
    <OptionMenu
      label="Change priority"
      value={task.priority}
      options={PRIORITY_OPTIONS}
      onSelect={priority => update.mutate({ id: task.id, patch: { priority } })}
      className={className}
    >
      {children}
    </OptionMenu>
  );
}

export function AssigneeMenu({ task, members, className, children }: MenuProps & { members: Member[] }) {
  const update = useUpdateTask();
  return (
    <OptionMenu
      label="Change assignee"
      value={task.assigneeId ?? UNASSIGNED}
      options={assigneeOptions(members)}
      onSelect={id => update.mutate({ id: task.id, patch: { assigneeId: id === UNASSIGNED ? null : id } })}
      className={className}
    >
      {children}
    </OptionMenu>
  );
}

export function DueMenu({ task, className, children }: MenuProps) {
  const update = useUpdateTask();
  return (
    <DatePicker value={task.dueDate ?? ''} onChange={dueDate => update.mutate({ id: task.id, patch: { dueDate: dueDate || null } })} className={className}>
      {children}
    </DatePicker>
  );
}
