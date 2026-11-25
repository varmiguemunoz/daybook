import { ROLE_LABELS, ROLES } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';

interface Props {
  query: string;
  role: string;
  onQuery: (value: string) => void;
  onRole: (value: string) => void;
}

export function MembersToolbar({ query, role, onQuery, onRole }: Props) {
  return (
    <div className="row" style={{ marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
      <div className="inwrap">
        <Icon name="search" size={13} />
        <input
          className="input search-sm"
          placeholder="Search by name or email"
          aria-label="Search members"
          value={query}
          onChange={event => onQuery(event.target.value)}
        />
      </div>
      <div className="seg">
        {['all', ...ROLES].map(value => (
          <button key={value} type="button" className={role === value ? 'on' : ''} onClick={() => onRole(value)}>
            {value === 'all' ? 'All' : ROLE_LABELS[value as (typeof ROLES)[number]]}
          </button>
        ))}
      </div>
    </div>
  );
}
