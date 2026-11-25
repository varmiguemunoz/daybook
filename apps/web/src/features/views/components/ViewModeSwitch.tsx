import { useNavigate } from 'react-router-dom';
import { Icon } from '../../../shared/ui/Icon';

const MODES = [
  { to: '/tasks', label: 'List', icon: 'list' },
  { to: '/board', label: 'Board', icon: 'square-kanban' },
  { to: '/table', label: 'Table', icon: 'table-2' },
];

export function ViewModeSwitch({ active }: { active: string }) {
  const navigate = useNavigate();

  return (
    <div className="seg">
      {MODES.map(mode => (
        <button key={mode.to} type="button" className={active === mode.to ? 'on' : ''} onClick={() => navigate(mode.to)}>
          <Icon name={mode.icon} size={13} />
          <span className="hide-m">{mode.label}</span>
        </button>
      ))}
    </div>
  );
}
