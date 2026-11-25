import { Icon } from '../../../shared/ui/Icon';

interface Entry {
  key: string;
  label: string;
  icon: string;
}

const GROUPS: Array<[string, Entry[]]> = [
  [
    'General',
    [
      { key: 'workspace', label: 'Workspace', icon: 'building-2' },
      { key: 'appearance', label: 'Appearance', icon: 'palette' },
    ],
  ],
  [
    'Workspace',
    [
      { key: 'members', label: 'Members', icon: 'users' },
      { key: 'teams', label: 'Teams', icon: 'users-round' },
      { key: 'permissions', label: 'Permissions', icon: 'shield' },
    ],
  ],
  [
    'Personal',
    [
      { key: 'profile', label: 'Profile', icon: 'user' },
      { key: 'shortcuts', label: 'Keyboard shortcuts', icon: 'keyboard' },
    ],
  ],
];

export function SettingsNav({ section, onSelect }: { section: string; onSelect: (key: string) => void }) {
  return (
    <nav className="set-nav" aria-label="Settings">
      {GROUPS.map(([group, entries]) => (
        <div key={group}>
          <div className="gh">{group}</div>
          {entries.map(entry => (
            <button key={entry.key} type="button" className={`sitem ${section === entry.key ? 'on' : ''}`.trim()} onClick={() => onSelect(entry.key)}>
              <Icon name={entry.icon} size={15} />
              <span>{entry.label}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
