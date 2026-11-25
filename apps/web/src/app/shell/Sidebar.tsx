import { NavLink } from 'react-router-dom';
import type { Member, Workspace } from '@gr8r/domain';
import { Icon } from '../../shared/ui/Icon';
import { Avatar } from '../../shared/ui/Avatar';
import { WorkspaceLogo } from '../../shared/ui/Brand';
import { PRIMARY_NAV, WORKSPACE_NAV } from './nav-items';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  workspace?: Workspace;
  me?: Member;
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ workspace, collapsed, onToggle }: Pick<SidebarProps, 'workspace' | 'collapsed' | 'onToggle'>) {
  return (
    <div className="side-top">
      <div className="row" style={{ gap: 2 }}>
        <button className="ws grow" type="button" aria-label="Switch workspace">
          <WorkspaceLogo name={workspace?.name ?? 'Gr8r'} color={workspace?.color ?? '#1D1C1A'} brand size={22} />
          <span className="ws-name trunc">{workspace?.name ?? 'Gr8r Studio'}</span>
          <span className="chev-d faint">
            <Icon name="chevrons-up-down" size={13} />
          </span>
        </button>
        {!collapsed && (
          <button
            className="ibtn ibtn-sm hide-m"
            type="button"
            onClick={onToggle}
            data-tip="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <Icon name="panel-left" size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarGroups({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="side-scroll">
      {PRIMARY_NAV.map(entry => (
        <SidebarItem key={entry.to} entry={entry} collapsed={collapsed} />
      ))}
      <div className="sgroup">
        <div className="sgroup-h">Workspace</div>
        {WORKSPACE_NAV.map(entry => (
          <SidebarItem key={entry.to} entry={entry} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}

function SidebarFooter({ me, collapsed }: { me?: Member; collapsed: boolean }) {
  return (
    <div className="side-bot">
      <button className="sitem" type="button" data-tip={collapsed ? 'Help' : undefined} data-tip-pos={collapsed ? 'right' : undefined}>
        <Icon name="circle-help" size={16} />
        <span>Help &amp; resources</span>
      </button>
      <NavLink to="/settings" className={({ isActive }) => `sitem ${isActive ? 'on' : ''}`.trim()}>
        <Icon name="settings" size={16} />
        <span>Settings</span>
      </NavLink>
      <button
        className="sitem"
        type="button"
        style={{ height: 36 }}
        data-tip={collapsed ? 'Profile' : undefined}
        data-tip-pos={collapsed ? 'right' : undefined}
      >
        <Avatar member={me} className="presence" tip={false} />
        <span className="trunc" style={{ color: 'var(--text)', fontWeight: 500 }}>
          {me?.name ?? 'Member'}
        </span>
        <span className="ct">
          <Icon name="chevrons-up-down" size={13} />
        </span>
      </button>
    </div>
  );
}

export function Sidebar({ workspace, me, collapsed, onToggle }: SidebarProps) {
  return (
    <nav className={`side ${collapsed ? 'collapsed' : ''}`.trim()} aria-label="Main">
      <SidebarHeader workspace={workspace} collapsed={collapsed} onToggle={onToggle} />
      <SidebarGroups collapsed={collapsed} />
      <SidebarFooter me={me} collapsed={collapsed} />
    </nav>
  );
}
