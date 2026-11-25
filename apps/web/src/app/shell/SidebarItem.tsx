import { NavLink } from 'react-router-dom';
import { Icon } from '../../shared/ui/Icon';
import type { NavEntry } from './nav-items';

interface SidebarItemProps {
  entry: NavEntry;
  count?: number;
  dot?: boolean;
  collapsed?: boolean;
}

export function SidebarItem({ entry, count, dot, collapsed }: SidebarItemProps) {
  return (
    <NavLink
      to={entry.to}
      end={entry.end}
      className={({ isActive }) => `sitem ${isActive ? 'on' : ''}`.trim()}
      data-tip={collapsed ? entry.label : undefined}
      data-tip-pos={collapsed ? 'right' : undefined}
    >
      <Icon name={entry.icon} size={16} />
      <span className="trunc">{entry.label}</span>
      {count ? <span className={`ct ${dot ? 'dotc' : ''}`.trim()}>{count}</span> : null}
    </NavLink>
  );
}
