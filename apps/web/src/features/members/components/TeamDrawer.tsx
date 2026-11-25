import { useState } from 'react';
import type { Member, Team } from '@gr8r/domain';
import { Drawer } from '../../../shared/ui/Drawer';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { useUpdateTeam, useDeleteTeam, useAddTeamMember, useRemoveTeamMember, useTeams } from "../../teams/queries";
import { showToast } from '../../../shared/ui/Toast';
import { IconPicker } from '../../../shared/ui/IconPicker';

interface Props {
  teamId: string | null;
  members: Member[];
  onClose: () => void;
}

function useTeamActions(team: Team, onClose: () => void) {
  const update = useUpdateTeam(team.id);
  const remove = useDeleteTeam(team.id);
  const addMember = useAddTeamMember(team.id);
  const removeMember = useRemoveTeamMember(team.id);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function save(patch: { name: string; description: string; color: string; icon: string }) {
    try {
      await update.mutateAsync(patch);
      showToast('Team updated', 'success');
    } catch {
      showToast('Failed to update team', 'error');
    }
  }

  async function add(id: string) {
    try {
      await addMember.mutateAsync(id);
    } catch {
      showToast('Failed to add member', 'error');
    }
  }

  async function removeMemberFn(id: string) {
    try {
      await removeMember.mutateAsync(id);
    } catch {
      showToast('Failed to remove member', 'error');
    }
  }

  async function deleteTeam() {
    try {
      await remove.mutateAsync();
      showToast('Team deleted', 'success');
      onClose();
    } catch {
      showToast('Failed to delete team', 'error');
    }
  }

  return { update, remove, addMember, removeMember, confirmOpen, setConfirmOpen, save, add, removeMemberFn, deleteTeam };
}

function TeamEditForm({ team, onSave, pending }: {
  team: Team;
  onSave: (patch: { name: string; description: string; color: string; icon: string }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description);
  const [color, setColor] = useState(team.color);
  const [icon, setIcon] = useState(team.icon);

  return (
    <div className="col" style={{ gap: 10 }}>
      <input className="input" value={name} onChange={event => setName(event.target.value)} aria-label="Name" />
      <IconPicker value={icon} onChange={setIcon} />
      <input className="input" type="color" value={color} onChange={event => setColor(event.target.value)} aria-label="Color" style={{ width: 48, padding: 2 }} />
      <textarea className="input" value={description} onChange={event => setDescription(event.target.value)} placeholder="Description" aria-label="Description" rows={3} />
      <button className="btn btn-primary" type="button" onClick={() => onSave({ name, description, color, icon })} disabled={pending}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function RosterList({ team, members, onRemove }: { team: Team; members: Member[]; onRemove: (id: string) => void }) {
  const roster = members.filter(member => team.memberIds.includes(member.id));
  return (
    <div className="stack" style={{ marginTop: 16 }}>
      <h3>Roster</h3>
      {roster.map(member => (
        <div key={member.id} className="row" style={{ gap: 8 }}>
          <span>{member.name}</span>
          <span className="sp" />
          <button className="ibtn ibtn-sm" type="button" onClick={() => onRemove(member.id)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function AddMemberRow({ team, members, onAdd, pending }: { team: Team; members: Member[]; onAdd: (id: string) => void; pending: boolean }) {
  const [selected, setSelected] = useState('');
  const available = members.filter(member => !team.memberIds.includes(member.id));
  return (
    <div className="row" style={{ gap: 8, marginTop: 8 }}>
      <select className="select" value={selected} onChange={event => setSelected(event.target.value)} aria-label="Add member">
        <option value="">Select member</option>
        {available.map(member => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <button className="btn btn-primary btn-sm" type="button" onClick={() => { if (selected) { onAdd(selected); setSelected(''); } }} disabled={!selected || pending}>
        Add
      </button>
    </div>
  );
}

function TeamDrawerBody({ teamId, members, onClose }: { teamId: string; members: Member[]; onClose: () => void }) {
  const { data: teams = [] } = useTeams();
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;
  const actions = useTeamActions(team, onClose);
  return (
    <Drawer open onClose={onClose} title={team.name}>
      <TeamEditForm team={team} onSave={actions.save} pending={actions.update.isPending} />
      <RosterList team={team} members={members} onRemove={actions.removeMemberFn} />
      <AddMemberRow team={team} members={members} onAdd={actions.add} pending={actions.addMember.isPending} />
      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" type="button" onClick={() => actions.setConfirmOpen(true)}>
          Delete team
        </button>
      </div>
      <ConfirmDialog open={actions.confirmOpen} title="Delete team" message={`Delete ${team.name}?`} onConfirm={actions.deleteTeam} onClose={() => actions.setConfirmOpen(false)} />
    </Drawer>
  );
}

export function TeamDrawer({ teamId, members, onClose }: Props) {
  if (!teamId) return null;
  return <TeamDrawerBody teamId={teamId} members={members} onClose={onClose} />;
}
