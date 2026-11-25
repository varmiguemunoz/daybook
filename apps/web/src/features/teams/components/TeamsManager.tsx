import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Icon } from '../../../shared/ui/Icon';
import { Modal } from '../../../shared/ui/Modal';
import { Skeleton } from '../../../shared/ui/Skeleton';
import { showToast } from '../../../shared/ui/Toast';
import { useCanManageOrganization, useMembers } from '../../members/queries';
import { useCreateTeam, useTeams } from '../queries';
import { EMPTY_TEAM, TeamFields } from './TeamFields';
import { TeamDrawer } from './TeamDrawer';
import { TeamsGrid } from './TeamsGrid';

function CreateTeamForm({ onDone }: { onDone: () => void }) {
  const [draft, setDraft] = useState(EMPTY_TEAM);
  const create = useCreateTeam();

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    create.mutate(
      { ...draft, name: draft.name.trim(), memberIds: [] },
      {
        onSuccess: () => {
          showToast('Team created', 'success');
          onDone();
        },
        onError: () => showToast('Could not create the team', 'error'),
      },
    );
  }

  return (
    <form className="col" style={{ gap: 14 }} onSubmit={submit}>
      <TeamFields draft={draft} onChange={setDraft} />
      <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
        <button className="btn btn-secondary" type="button" onClick={onDone}>
          Cancel
        </button>
        <button className="btn btn-primary" type="submit" disabled={create.isPending || !draft.name.trim()}>
          {create.isPending ? 'Creating…' : 'Create team'}
        </button>
      </div>
    </form>
  );
}

export function TeamsManager() {
  const { data: teams = [], isLoading } = useTeams();
  const { data: members = [] } = useMembers();
  const canManage = useCanManageOrganization();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);

  function selectTeam(id: string | null) {
    setParams(current => {
      if (id) current.set('team', id);
      else current.delete('team');
      return current;
    });
  }

  return (
    <>
      {canManage && (
        <div className="row" style={{ marginBottom: 12 }}>
          <span className="sp" />
          <button className="btn btn-primary btn-sm" type="button" onClick={() => setCreating(true)}>
            <Icon name="plus" size={14} />
            New team
          </button>
        </div>
      )}
      {isLoading && <Skeleton lines={4} />}
      {!isLoading && !teams.length && <EmptyState icon="users-round" title="No teams yet" text="Create a team to group the people who work together." />}
      {teams.length > 0 && <TeamsGrid teams={teams} members={members} onOpen={selectTeam} />}
      <Modal open={creating} onClose={() => setCreating(false)} title="New team">
        {creating && <CreateTeamForm onDone={() => setCreating(false)} />}
      </Modal>
      <TeamDrawer teamId={params.get('team')} members={members} canManage={canManage} onClose={() => selectTeam(null)} />
    </>
  );
}
