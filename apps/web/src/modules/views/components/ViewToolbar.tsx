import type { ReactNode } from 'react';
import { Icon } from '../../core/components/Icon';
import { SearchField } from '../../core/components/SearchField';

interface Props {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
  filter?: ReactNode;
  sortLabel?: string;
  onCycleSort?: () => void;
  groupLabel?: string;
  onCycleGroup?: () => void;
  right?: ReactNode;
}

export function ViewToolbar({ query, onQuery, placeholder, filter, sortLabel, onCycleSort, groupLabel, onCycleGroup, right }: Props) {
  return (
    <div className="toolbar" role="toolbar">
      <SearchField value={query} onChange={onQuery} placeholder={placeholder} />
      {filter}
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
