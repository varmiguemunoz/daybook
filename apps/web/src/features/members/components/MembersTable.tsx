import { useState } from 'react';
import type { Member, Task, Team } from '@gr8r/domain';
import { ROLE_LABELS, ROLES } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { Icon } from '../../../shared/ui/Icon';
import { showToast } from '../../../shared/ui/Toast';
import { useCanManageOrganization, useChangeRole, useRemoveMember } from '../queries';

interface RowProps {
  member: Member;
  teams: Team[];
  openTasks: number;
  isMe: boolean;
  canManage: boolean;
}

function RoleSelect({ member, disabled }: { member: Member; disabled: boolean }) {
  const changeRole = useChangeRole(member);
  return (
    <select
      className="select"
      value={member.role}
      onChange={event => changeRole.mutate(event.target.value as Member['role'], { onError: () => showToast('Could not change the role', 'error') })}
      aria-label={`Role of ${member.name}`}
      disabled={disabled || changeRole.isPending}
    >
      {ROLES.map(role => (
        <option key={role} value={role}>
          {ROLE_LABELS[role]}
        </option>
      ))}
    </select>
  );
}

function RemoveMember({ member }: { member: Member }) {
  const remove = useRemoveMember();
  const [confirming, setConfirming] = useState(false);

  function confirm() {
    setConfirming(false);
    remove.mutate(member.id, {
      onSuccess: () => showToast(`${member.name} was removed`, 'success'),
      onError: error => showToast(error.message.includes('admin') ? 'A workspace needs at least one admin' : 'Could not remove the member', 'error'),
    });
  }

  return (
    <>
      <button
        className="ibtn ibtn-sm"
        type="button"
        aria-label={`Remove ${member.name}`}
        data-tip="Remove from workspace"
        onClick={() => setConfirming(true)}
        disabled={remove.isPending}
      >
        <Icon name="trash-2" size={14} />
      </button>
      <ConfirmDialog
        open={confirming}
        title="Remove member"
        message={`${member.name} loses access to this workspace. Their tasks become unassigned and they leave every team.`}
        confirmLabel="Remove"
        onConfirm={confirm}
        onClose={() => setConfirming(false)}
      />
    </>
  );
}

function MemberRow({ member, teams, openTasks, isMe, canManage }: RowProps) {
  const memberTeams = teams.filter(team => team.memberIds.includes(member.id));

  return (
    <tr>
      <td>
        <span className="row" style={{ gap: 10 }}>
          <Avatar member={member} className="md" tip={false} />
          <span className="col" style={{ minWidth: 0 }}>
            <b className="trunc" style={{ fontWeight: 500 }}>
              {member.name}
              {isMe && (
                <span className="faint" style={{ fontWeight: 400 }}>
                  {' '}
                  (you)
                </span>
              )}
            </b>
            <span className="faint trunc" style={{ fontSize: 12 }}>
              {member.email}
            </span>
          </span>
        </span>
      </td>
      <td>
        <RoleSelect member={member} disabled={!canManage || isMe} />
      </td>
      <td className="muted">{memberTeams.length ? memberTeams.map(team => team.name).join(', ') : '—'}</td>
      <td className="num">{openTasks}</td>
      <td style={{ textAlign: 'right' }}>{canManage && !isMe && <RemoveMember member={member} />}</td>
    </tr>
  );
}

export function MembersTable({ members, tasks, teams, meId }: { members: Member[]; tasks: Task[]; teams: Team[]; meId: string }) {
  const canManage = useCanManageOrganization();

  return (
    <div className="panel" style={{ overflowX: 'auto' }}>
      <table className="perm-t members-t">
        <thead>
          <tr>
            <th style={{ width: '38%' }}>Member</th>
            <th style={{ width: 140 }}>Role</th>
            <th>Teams</th>
            <th style={{ width: 80 }}>Open tasks</th>
            <th style={{ width: 56 }} />
          </tr>
        </thead>
        <tbody>
          {members.map(member => (
            <MemberRow
              key={member.id}
              member={member}
              teams={teams}
              openTasks={tasks.filter(task => task.assigneeId === member.id && task.status !== 'done').length}
              isMe={member.id === meId}
              canManage={canManage}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
