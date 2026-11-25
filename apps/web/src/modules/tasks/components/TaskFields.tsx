import type { Member } from '@daybook/domain';
import type { MenuOption } from '../../core/components/OptionMenu';
import { DatePicker } from '../../core/components/DatePicker';
import { UNASSIGNED } from '../../views/lib/view-model';
import type { TaskDraft } from '../hooks/use-task-draft';
import { PRIORITY_OPTIONS, STATUS_OPTIONS, assigneeOptions } from './task-options';

interface Props {
  draft: TaskDraft;
  members: Member[];
  onChange: <Field extends keyof TaskDraft>(field: Field, value: TaskDraft[Field]) => void;
  autoFocus?: boolean;
}

interface SelectProps<Value extends string> {
  id: string;
  label: string;
  value: Value;
  options: MenuOption<Value>[];
  onChange: (value: Value) => void;
}

function SelectField<Value extends string>({ id, label, value, options, onChange }: SelectProps<Value>) {
  return (
    <div className="field" style={{ flex: 1, minWidth: 0 }}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="select" value={value} onChange={event => onChange(event.target.value as Value)}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TaskFields({ draft, members, onChange, autoFocus }: Props) {
  return (
    <>
      <div className="field">
        <label className="label" htmlFor="task-title">
          Title
        </label>
        <input
          id="task-title"
          className="input"
          value={draft.title}
          onChange={event => onChange('title', event.target.value)}
          placeholder="What needs to be done?"
          maxLength={200}
          autoFocus={autoFocus}
        />
      </div>
      <div className="row" style={{ gap: 10 }}>
        <SelectField id="task-status" label="Status" value={draft.status} options={STATUS_OPTIONS} onChange={value => onChange('status', value)} />
        <SelectField id="task-priority" label="Priority" value={draft.priority} options={PRIORITY_OPTIONS} onChange={value => onChange('priority', value)} />
      </div>
      <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
        <SelectField
          id="task-assignee"
          label="Assignee"
          value={draft.assigneeId ?? UNASSIGNED}
          options={assigneeOptions(members)}
          onChange={value => onChange('assigneeId', value === UNASSIGNED ? null : value)}
        />
        <div className="field" style={{ flex: 1 }}>
          <span className="label">Due date</span>
          <DatePicker value={draft.dueDate} onChange={value => onChange('dueDate', value)} className="btn btn-secondary" />
        </div>
      </div>
    </>
  );
}
