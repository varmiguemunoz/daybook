import { IconPicker } from '../../core/components/IconPicker';

export interface TeamDraft {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const EMPTY_TEAM: TeamDraft = { name: '', description: '', icon: 'users', color: '#6B7280' };

function TeamLook({ draft, onChange }: { draft: TeamDraft; onChange: (draft: TeamDraft) => void }) {
  return (
    <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
      <div className="field grow">
        <span className="label">Icon</span>
        <IconPicker value={draft.icon} onChange={icon => onChange({ ...draft, icon })} />
      </div>
      <div className="field">
        <label className="label" htmlFor="team-color">
          Color
        </label>
        <input
          id="team-color"
          className="input"
          type="color"
          value={draft.color}
          onChange={event => onChange({ ...draft, color: event.target.value })}
          style={{ width: 52, padding: 2 }}
        />
      </div>
    </div>
  );
}

export function TeamFields({ draft, onChange }: { draft: TeamDraft; onChange: (draft: TeamDraft) => void }) {
  return (
    <>
      <div className="field">
        <label className="label" htmlFor="team-name">
          Name
        </label>
        <input
          id="team-name"
          className="input"
          value={draft.name}
          onChange={event => onChange({ ...draft, name: event.target.value })}
          maxLength={200}
          autoFocus
        />
      </div>
      <div className="field">
        <label className="label" htmlFor="team-description">
          Description
        </label>
        <textarea
          id="team-description"
          className="textarea"
          value={draft.description}
          onChange={event => onChange({ ...draft, description: event.target.value })}
          maxLength={200}
          rows={2}
        />
      </div>
      <TeamLook draft={draft} onChange={onChange} />
    </>
  );
}
