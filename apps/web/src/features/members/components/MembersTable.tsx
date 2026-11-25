import type { Member, Task } from '@gr8r/domain';
import { ROLE_LABELS, ROLES } from '@gr8r/domain';
import { Icon } from '../../../shared/ui/Icon';
import { Avatar } from '../../../shared/ui/Avatar';
import { timeAgo } from '../../../shared/dates';
import { useChangeRole, useDeactivateMember } from '../queries';

const TEAM_NAMES: Record<string, string> = {
  design: 'Design',
  eng: 'Engineering',
  mkt: 'Marketing',
  product: 'Product',
};

function StatusBadge({ status }: { status: Member['status'] }) {
  if (status === 'invited') {
    return (
      <span className="badge amber">
        <span className="dot" />
        Invited
      </span>
    );
  }
  if (status === 'disabled') return <span className="badge gray">Deactivated</span>;
  return (
    <span className="badge green">
      <span className="dot" />
      Active
    </span>
  );
}

function RoleSelect({ member }: { member: Member }) {
  const changeRole = useChangeRole(member.id);
  return (
    <select
      className="select"
      value={member.role}
      onChange={event => changeRole.mutate(event.target.value as Member['role'])}
      aria-label="Role"
      disabled={member.role === 'owner' || changeRole.isPending}
    >
      {ROLES.map(role => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

function DeactivateButton({ member }: { member: Member }) {
  const deactivate = useDeactivateMember(member.id);
  return (
    <button
      className="ibtn ibtn-sm"
      type="button"
      aria-label="Member options"
      disabled={deactivate.isPending}
      onClick={() => {
        if (window.confirm(`Deactivate ${member.name}?`)) deactivate.mutate();
      }}
    >
      <Icon name="ellipsis" size={14} />
    </button>
  );
}

interface RowProps {
  member: Member;
  tasks: Task[];
  meId: string;
}

function MemberRow({ member, tasks, meId }: RowProps) {
  const openTasks = tasks.filter(task => task.assigneeId === member.id && task.status !== 'done').length;

  return (
    <tr>
      <td style={{ paddingLeft: 14 }}>
        <span className="row" style={{ gap: 10, textAlign: 'left' }}>
          <Avatar member={member} className="md" tip={false} />
          <span className="col">
            <b style={{ fontWeight: 500 }}>
              {member.name}
              {member.id === meId && <span className="faint" style={{ fontWeight: 400 }}> (you)</span>}
            </b>
            <span className="faint" style={{ fontSize: 12 }}>
              {member.email}
            </span>
          </span>
        </span>
      </td>
      <td style={{ textAlign: 'left' }}>
        <RoleSelect member={member} />
      </td>
      <td style={{ textAlign: 'left' }}>
        <span className="row">{member.teamId ? (TEAM_NAMES[member.teamId] ?? member.teamId) : '—'}</span>
      </td>
      <td className="num">{openTasks}</td>
      <td style={{ textAlign: 'left' }} className="muted">
        {member.lastSeenAt ? timeAgo(member.lastSeenAt) : '—'}
      </td>
      <td style={{ textAlign: 'left' }}>
        <StatusBadge status={member.status} />
      </td>
      <td>
        <DeactivateButton member={member} />
      </td>
    </tr>
  );
}

interface Props {
  members: Member[];
  tasks: Task[];
  meId: string;
}

export function MembersTable({ members, tasks, meId }: Props) {
  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      <table className="perm-t" style={{ minWidth: 880 }}>
        <thead>
          <tr>
            <th style={{ paddingLeft: 14 }}>Member</th>
            <th style={{ textAlign: 'left' }}>Role</th>
            <th style={{ textAlign: 'left' }}>Team</th>
            <th>Tasks</th>
            <th style={{ textAlign: 'left' }}>Last active</th>
            <th style={{ textAlign: 'left' }}>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <MemberRow key={member.id} member={member} tasks={tasks} meId={meId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
