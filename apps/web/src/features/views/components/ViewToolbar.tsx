import type { ReactNode } from 'react';
import { Icon } from '../../../shared/ui/Icon';

interface Props {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
  sortLabel?: string;
  onCycleSort?: () => void;
  groupLabel?: string;
  onCycleGroup?: () => void;
  right?: ReactNode;
}

export function ViewToolbar({ query, onQuery, placeholder = 'Search tasks', sortLabel, onCycleSort, groupLabel, onCycleGroup, right }: Props) {
  return (
    <div className="toolbar" role="toolbar">
      <div className="inwrap">
        <Icon name="search" size={13} />
        <input className="input search-sm" placeholder={placeholder} aria-label={placeholder} value={query} onChange={event => onQuery(event.target.value)} />
      </div>
      <button className="btn btn-ghost" type="button" aria-haspopup="dialog" aria-label="Filter tasks">
        <Icon name="list-filter" size={14} />
        Filter
      </button>
      {sortLabel && (
        <button className="btn btn-ghost" type="button" onClick={onCycleSort} aria-label={`Sort: ${sortLabel}`} data-tip="Click to change the sort">
          <Icon name="arrow-up-down" size={14} />
          <span className="hide-m">Sort:</span> {sortLabel}
        </button>
      )}
      {groupLabel && (
        <button className="btn btn-ghost" type="button" onClick={onCycleGroup} aria-label={`Group: ${groupLabel}`} data-tip="Click to change grouping">
          <Icon name="rows-3" size={14} />
          <span className="hide-m">Group:</span> {groupLabel}
        </button>
      )}
      <span className="sp" />
      {right}
    </div>
  );
}
