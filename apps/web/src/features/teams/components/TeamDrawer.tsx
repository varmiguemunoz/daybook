import { useState, type FormEvent } from 'react';
import type { Member, Team } from '@gr8r/domain';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { Drawer } from '../../../shared/ui/Drawer';
import { Icon } from '../../../shared/ui/Icon';
import { showToast } from '../../../shared/ui/Toast';
import { useDeleteTeam, useTeams, useUpdateTeam } from '../queries';
import { TeamFields, type TeamDraft } from './TeamFields';
import { TeamRoster } from './TeamRoster';

function useTeamEditor(team: Team, onClose: () => void) {
  const [draft, setDraft] = useState<TeamDraft>({ name: team.name, description: team.description, icon: team.icon, color: team.color });
  const update = useUpdateTeam();
  const remove = useDeleteTeam();

  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.name.trim()) return;
    update.mutate(
      { id: team.id, patch: { ...draft, name: draft.name.trim() } },
      { onSuccess: () => showToast('Team updated', 'success'), onError: () => showToast('Could not update the team', 'error') },
    );
  }

  function destroy() {
    onClose();
    remove
      .mutateAsync(team.id)
      .then(() => showToast(`${team.name} deleted`, 'success'))
      .catch(() => showToast('Could not delete the team', 'error'));
  }

  return { draft, setDraft, save, destroy, saving: update.isPending };
}

function TeamEditor({ team, members, canManage, onClose }: { team: Team; members: Member[]; canManage: boolean; onClose: () => void }) {
  const { draft, setDraft, save, destroy, saving } = useTeamEditor(team, onClose);
  const [confirming, setConfirming] = useState(false);

  return (
    <fieldset disabled={!canManage} className="col" style={{ gap: 18, border: 0, padding: 0, margin: 0 }}>
      <form className="col" style={{ gap: 14 }} onSubmit={save}>
        <TeamFields draft={draft} onChange={setDraft} />
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-danger-ghost" type="button" onClick={() => setConfirming(true)}>
            <Icon name="trash-2" size={14} />
            Delete team
          </button>
          <span className="sp" />
          <button className="btn btn-primary" type="submit" disabled={saving || !draft.name.trim()}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
      <TeamRoster team={team} members={members} />
      <ConfirmDialog
        open={confirming}
        title="Delete team"
        message={`${team.name} will be deleted. Its people stay in the workspace.`}
        onConfirm={destroy}
        onClose={() => setConfirming(false)}
      />
    </fieldset>
  );
}

export function TeamDrawer({ teamId, members, canManage, onClose }: { teamId: string | null; members: Member[]; canManage: boolean; onClose: () => void }) {
  const { data: teams } = useTeams();
  const team = teams?.find(item => item.id === teamId);

  if (!team) return null;

  return (
    <Drawer open title={team.name} onClose={onClose}>
      <TeamEditor key={team.id} team={team} members={members} canManage={canManage} onClose={onClose} />
    </Drawer>
  );
}
