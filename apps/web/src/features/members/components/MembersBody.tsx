import { useState } from 'react';
import type { Member, Task } from '@gr8r/domain';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Modal } from '../../../shared/ui/Modal';
import { useCreateTeam } from '../../teams/queries';
import { showToast } from '../../../shared/ui/Toast';
import { MembersTable } from './MembersTable';
import { PermissionsTable } from './PermissionsTable';
import { TeamsGrid } from './TeamsGrid';
import { TeamDrawer } from './TeamDrawer';
import { useTeams } from '../../teams/queries';
import type { MembersTab } from './MembersHeader';

interface Props {
  tab: MembersTab;
  members: Member[];
  tasks: Task[];
  meId: string;
}

function TeamsTab({ members }: { members: Member[] }) {
  const { data: teams = [] } = useTeams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const create = useCreateTeam();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), icon: 'users', color: '#6B7280', description: '', memberIds: [] });
      setName('');
      setOpen(false);
      showToast('Team created', 'success');
    } catch {
      showToast('Failed to create team', 'error');
    }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 12 }}>
        <span className="sp" />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setOpen(true)}>
          New team
        </button>
      </div>
      <TeamsGrid teams={teams} members={members} onOpen={id => setSelectedId(id)} />
      <Modal open={open} onClose={() => setOpen(false)} title="New team">
        <form className="col" style={{ gap: 10 }} onSubmit={submit}>
          <input className="input" value={name} onChange={event => setName(event.target.value)} placeholder="Team name" aria-label="Team name" />
          <button className="btn btn-primary" type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      </Modal>
      <TeamDrawer teamId={selectedId} members={members} onClose={() => setSelectedId(null)} />
    </>
  );
}

export function MembersBody({ tab, members, tasks, meId }: Props) {
  if (tab === 'teams') return <TeamsTab members={members} />;
  if (tab === 'roles') return <PermissionsTable />;
  if (!members.length) {
    return <EmptyState icon="search-x" title="No results found" text="No members match that search." className="sm" />;
  }
  return <MembersTable members={members} tasks={tasks} meId={meId} />;
}
