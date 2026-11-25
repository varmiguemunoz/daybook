import { useState } from 'react';
import type { Member } from '@daybook/domain';
import { Icon } from '../../core/components/Icon';
import type { MenuOption } from '../../core/components/OptionMenu';
import { Popover } from '../../core/components/Popover';
import { EMPTY_FILTER, activeFilterCount, type TaskFilter } from '../../views/lib/view-model';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeOptions } from './task-options';

interface Props {
  filter: TaskFilter;
  members: Member[];
  onChange: (filter: TaskFilter) => void;
}

function toggled<Value>(list: Value[], value: Value): Value[] {
  return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
}

function FilterGroup<Value extends string>({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: MenuOption<Value>[];
  selected: Value[];
  onToggle: (value: Value) => void;
}) {
  return (
    <div role="group" aria-label={title}>
      <div className="mh">{title}</div>
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          className="mi"
          role="menuitemcheckbox"
          aria-checked={selected.includes(option.value)}
          onClick={() => onToggle(option.value)}
        >
          {option.icon}
          <span className="trunc">{option.label}</span>
          {selected.includes(option.value) && <Icon name="check" size={14} className="ck" />}
        </button>
      ))}
    </div>
  );
}

function FilterMenu({ filter, members, onChange }: Props) {
  const count = activeFilterCount(filter);

  return (
    <div role="menu" aria-label="Filter tasks">
      <FilterGroup
        title="Status"
        options={STATUS_OPTIONS}
        selected={filter.status}
        onToggle={value => onChange({ ...filter, status: toggled(filter.status, value) })}
      />
      <div className="msep" />
      <FilterGroup
        title="Priority"
        options={PRIORITY_OPTIONS}
        selected={filter.priority}
        onToggle={value => onChange({ ...filter, priority: toggled(filter.priority, value) })}
      />
      <div className="msep" />
      <FilterGroup
        title="Assignee"
        options={assigneeOptions(members)}
        selected={filter.assignee}
        onToggle={value => onChange({ ...filter, assignee: toggled(filter.assignee, value) })}
      />
      {count > 0 && (
        <>
          <div className="msep" />
          <button type="button" className="mi" role="menuitem" onClick={() => onChange(EMPTY_FILTER)}>
            <Icon name="x" size={14} />
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

export function TaskFilters({ filter, members, onChange }: Props) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const count = activeFilterCount(filter);

  return (
    <>
      <button
        className={`btn btn-ghost ${count ? 'on' : ''}`.trim()}
        type="button"
        aria-haspopup="menu"
        aria-expanded={Boolean(anchor)}
        onClick={event => setAnchor(anchor ? null : event.currentTarget)}
      >
        <Icon name="list-filter" size={14} />
        Filter
        {count > 0 && <span className="num">· {count}</span>}
      </button>
      <Popover open={Boolean(anchor)} anchor={anchor} onClose={() => setAnchor(null)} className="pop enter">
        <FilterMenu filter={filter} members={members} onChange={onChange} />
      </Popover>
    </>
  );
}
