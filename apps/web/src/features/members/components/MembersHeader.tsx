import { Icon } from '../../../shared/ui/Icon';

export type MembersTab = 'members' | 'teams' | 'roles';

const TABS: Array<[MembersTab, string]> = [
  ['members', 'Members'],
  ['teams', 'Teams'],
  ['roles', 'Roles & permissions'],
];

interface Props {
  tab: MembersTab;
  onTab: (tab: MembersTab) => void;
  workspace: string;
  total: number;
  pending: number;
  onInvite: () => void;
}

export function MembersHeader({ tab, onTab, workspace, total, pending, onInvite }: Props) {
  return (
    <>
      <div className="ph">
        <div>
          <h1>Members</h1>
          <p>
            <span className="num">{total}</span> people in {workspace} · <span className="num">{pending}</span> pending
          </p>
        </div>
        <div className="acts">
          <button className="btn btn-primary" type="button" onClick={onInvite}>
            <Icon name="user-plus" size={14} />
            Invite member
          </button>
        </div>
      </div>
      <div className="tabs" style={{ marginBottom: 14 }}>
        {TABS.map(([key, label]) => (
          <button key={key} type="button" className={`tab ${tab === key ? 'on' : ''}`.trim()} onClick={() => onTab(key)}>
            {label}
          </button>
        ))}
      </div>
    </>
  );
}
