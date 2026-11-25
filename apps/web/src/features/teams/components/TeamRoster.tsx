import { useState } from 'react';
import type { Member, Team } from '@gr8r/domain';
import { Avatar } from '../../../shared/ui/Avatar';
import { Icon } from '../../../shared/ui/Icon';
import { showToast } from '../../../shared/ui/Toast';
import { useAddTeamMember, useRemoveTeamMember } from '../queries';

function AddMember({ team, available }: { team: Team; available: Member[] }) {
  const [selected, setSelected] = useState('');
  const add = useAddTeamMember();

  function submit() {
    add.mutate({ teamId: team.id, memberId: selected }, { onSuccess: () => setSelected(''), onError: () => showToast('Could not add the member', 'error') });
  }

  return (
    <div className="row" style={{ gap: 8 }}>
      <select className="select" value={selected} onChange={event => setSelected(event.target.value)} aria-label="Member to add">
        <option value="">Add someone to this team…</option>
        {available.map(member => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <button className="btn btn-secondary" type="button" onClick={submit} disabled={!selected || add.isPending}>
        Add
      </button>
    </div>
  );
}

export function TeamRoster({ team, members }: { team: Team; members: Member[] }) {
  const remove = useRemoveTeamMember();
  const roster = members.filter(member => team.memberIds.includes(member.id));
  const available = members.filter(member => !team.memberIds.includes(member.id));

  return (
    <div className="col" style={{ gap: 8 }}>
      <span className="label">People · {roster.length}</span>
      {roster.map(member => (
        <div key={member.id} className="row" style={{ gap: 10 }}>
          <Avatar member={member} className="sm" tip={false} />
          <span className="trunc grow">{member.name}</span>
          <button
            className="ibtn ibtn-sm"
            type="button"
            aria-label={`Remove ${member.name} from ${team.name}`}
            onClick={() => remove.mutate({ teamId: team.id, memberId: member.id }, { onError: () => showToast('Could not remove the member', 'error') })}
          >
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
      {available.length > 0 && <AddMember team={team} available={available} />}
    </div>
  );
}
