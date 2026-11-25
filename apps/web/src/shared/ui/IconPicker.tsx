import { Icon } from './Icon';

const ICONS = [
  'users',
  'users-round',
  'palette',
  'code',
  'megaphone',
  'target',
  'folder',
  'folder-kanban',
  'star',
  'heart',
  'zap',
  'shield',
  'rocket',
  'globe',
  'smartphone',
  'layout-grid',
  'briefcase',
  'building-2',
  'calendar',
  'clock',
  'mail',
  'message-square',
  'settings',
  'wrench',
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: Props) {
  return (
    <div className="icon-picker" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, padding: 4 }}>
      {ICONS.map(name => (
        <button
          key={name}
          type="button"
          className={`ibtn ${value === name ? 'on' : ''}`.trim()}
          onClick={() => onChange(name)}
          aria-label={name}
          title={name}
          style={{ display: 'grid', placeItems: 'center', height: 32 }}
        >
          <Icon name={name} size={16} />
        </button>
      ))}
    </div>
  );
}
