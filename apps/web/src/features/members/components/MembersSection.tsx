import { useState } from 'react';
import type { Member } from '@gr8r/domain';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Icon } from '../../../shared/ui/Icon';
import { Modal } from '../../../shared/ui/Modal';
import { useTasks } from '../../tasks/queries';
import { useTeams } from '../../teams/queries';
import { useBootstrap } from '../../workspace/queries';
import { useCanManageOrganization, useMembers } from '../queries';
import { InviteForm } from './InviteForm';
import { MembersTable } from './MembersTable';
import { MembersToolbar } from './MembersToolbar';

function filterMembers(members: Member[], role: string, query: string): Member[] {
  const term = query.trim().toLowerCase();
  return members.filter(member => {
    if (role !== 'all' && member.role !== role) return false;
    return !term || member.name.toLowerCase().includes(term) || member.email.toLowerCase().includes(term);
  });
}

export function MembersSection() {
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();
  const { data: teams = [] } = useTeams();
  const { data: bootstrap } = useBootstrap();
  const canManage = useCanManageOrganization();
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const visible = filterMembers(members, role, query);

  return (
    <>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <MembersToolbar query={query} role={role} onQuery={setQuery} onRole={setRole} />
        <span className="sp" />
        {canManage && (
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setInviteOpen(true)}>
            <Icon name="user-plus" size={14} />
            Invite member
          </button>
        )}
      </div>
      {visible.length ? (
        <MembersTable members={visible} tasks={tasks} teams={teams} meId={bootstrap?.me.id ?? ''} />
      ) : (
        <EmptyState icon="search-x" title="No members found" text="No members match that search." className="sm" />
      )}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <InviteForm />
      </Modal>
    </>
  );
}
