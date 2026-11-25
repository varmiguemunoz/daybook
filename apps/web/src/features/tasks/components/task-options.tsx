import type { Member, Priority, TaskStatus } from '@gr8r/domain';
import { PRIORITIES, PRIORITY_LABELS, TASK_STATUS_LABELS, TASK_STATUSES } from '@gr8r/domain';
import type { MenuOption } from '../../../shared/ui/OptionMenu';
import { Avatar } from '../../../shared/ui/Avatar';
import { PriorityIcon, StatusIcon } from '../../../shared/ui/vocab';
import { UNASSIGNED } from '../../views/view-model';

export const STATUS_OPTIONS: MenuOption<TaskStatus>[] = TASK_STATUSES.map(status => ({
  value: status,
  label: TASK_STATUS_LABELS[status],
  icon: <StatusIcon status={status} size={14} />,
}));

export const PRIORITY_OPTIONS: MenuOption<Priority>[] = PRIORITIES.map(priority => ({
  value: priority,
  label: PRIORITY_LABELS[priority],
  icon: <PriorityIcon priority={priority} size={14} />,
}));

export function assigneeOptions(members: Member[]): MenuOption<string>[] {
  const active = members.filter(member => member.status === 'active');
  return [
    { value: UNASSIGNED, label: 'Unassigned', icon: <Avatar member={undefined} className="sm" tip={false} /> },
    ...active.map(member => ({ value: member.id, label: member.name, icon: <Avatar member={member} className="sm" tip={false} /> })),
  ];
}
