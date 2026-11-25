import { useState } from 'react';
import type { Member } from '@gr8r/domain';
import { useBootstrap } from '../../workspace/queries';
import { useTasks } from '../../tasks/queries';
import { useMembers } from '../queries';
import { Modal } from '../../../shared/ui/Modal';
import { InviteForm } from './InviteForm';
import { MembersHeader, type MembersTab } from './MembersHeader';
import { MembersToolbar } from './MembersToolbar';
import { MembersBody } from './MembersBody';

function filterMembers(members: Member[], role: string, term: string): Member[] {
  return members.filter(member => {
    const matchesRole = role === 'all' || member.role === role;
    if (!matchesRole) return false;
    if (!term) return true;
    return member.name.toLowerCase().includes(term) || member.email.includes(term);
  });
}

export function MembersPage() {
  const { data: members = [] } = useMembers();
  const { data: tasks = [] } = useTasks();
  const { data: bootstrap } = useBootstrap();
  const [tab, setTab] = useState<MembersTab>('members');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const filtered = filterMembers(members, role, query.toLowerCase());

  return (
    <div className="page wide" style={{ maxWidth: 1200 }}>
      <MembersHeader
        tab={tab}
        onTab={setTab}
        workspace={bootstrap?.workspace.name ?? 'this workspace'}
        total={members.length}
        pending={members.filter(member => member.status === 'invited').length}
        onInvite={() => setInviteOpen(true)}
      />
      {tab === 'members' && <MembersToolbar query={query} role={role} onQuery={setQuery} onRole={setRole} />}
      <MembersBody tab={tab} members={filtered} tasks={tasks} meId={bootstrap?.me.id ?? ''} />
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite member">
        <InviteForm />
      </Modal>
    </div>
  );
}
