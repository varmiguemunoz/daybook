import type { Member, Team } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import { AvatarStack } from '../../core/components/Avatar';

interface Props {
  teams: Team[];
  members: Member[];
  onOpen: (teamId: string) => void;
}

export function TeamsGrid({ teams, members, onOpen }: Props) {
  return (
    <div className="pgrid">
      {teams.map(team => {
        const roster = members.filter(member => team.memberIds.includes(member.id));
        return (
          <button key={team.id} type="button" className="pcard" onClick={() => onOpen(team.id)} style={{ cursor: 'pointer', textAlign: 'left' }}>
            <div className="row">
              <span className="picon" style={{ ['--c' as string]: team.color }}>
                <Icon name={team.icon} size={15} />
              </span>
              <b style={{ fontWeight: 600, fontSize: 14 }}>{team.name}</b>
            </div>
            <div className="desc">{team.description}</div>
            <div className="foot">
              <span className="row" style={{ gap: 4 }}>
                <Icon name="users" size={12} />
                {roster.length} {roster.length === 1 ? 'member' : 'members'}
              </span>
              <span className="sp" />
              <AvatarStack members={roster} max={4} />
            </div>
          </button>
        );
      })}
    </div>
  );
}
