import type { Member } from '@daybook/domain';

export type ActivityFilter = 'all' | 'status' | 'comments';

const FILTERS: Array<[ActivityFilter, string]> = [
  ['all', 'All'],
  ['status', 'Status changes'],
  ['comments', 'Comments'],
];

interface Props {
  filter: ActivityFilter;
  who: string;
  members: Member[];
  onFilter: (filter: ActivityFilter) => void;
  onWho: (who: string) => void;
}

export function ActivityFilters({ filter, who, members, onFilter, onWho }: Props) {
  return (
    <div className="row" style={{ gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
      <div className="seg">
        {FILTERS.map(([key, label]) => (
          <button key={key} type="button" className={filter === key ? 'on' : ''} onClick={() => onFilter(key)}>
            {label}
          </button>
        ))}
      </div>
      <select
        className="select"
        style={{ height: 26, width: 'auto', fontSize: 12 }}
        aria-label="Filter by person"
        value={who}
        onChange={event => onWho(event.target.value)}
      >
        <option value="all">Everyone</option>
        {members.map(member => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
    </div>
  );
}
