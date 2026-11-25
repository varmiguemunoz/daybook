import { Icon } from '../../modules/core/components/Icon';
import { useLocation, useNavigate } from 'react-router-dom';

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const item = (to: string, label: string, icon: string) => (
    <button type="button" className={pathname === to ? 'on' : ''} onClick={() => navigate(to)}>
      <Icon name={icon} size={19} />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="bottomnav" aria-label="Primary">
      {item('/', 'Home', 'house')}
      {item('/tasks', 'My Tasks', 'circle-check')}
      {item('/notifications', 'Inbox', 'inbox')}
      <button type="button">
        <Icon name="ellipsis" size={19} />
        <span>More</span>
      </button>
    </nav>
  );
}
