import { NavLink } from 'react-router-dom';
import { SignOutButton } from '@clerk/react';
import type { Member } from '@daybook/domain';
import { Icon } from '../../modules/core/components/Icon';
import { Avatar } from '../../modules/core/components/Avatar';
import { OrganizationSwitcher } from '../../modules/organizations/components/OrganizationSwitcher';
import { PRIMARY_NAV, WORKSPACE_NAV } from './nav-items';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
  me?: Member;
  collapsed: boolean;
  onToggle: () => void;
}

function SidebarHeader({ collapsed, onToggle }: Pick<SidebarProps, 'collapsed' | 'onToggle'>) {
  return (
    <div className="side-top">
      <div className="row" style={{ gap: 2 }}>
        <OrganizationSwitcher />
        {!collapsed && (
          <button className="ibtn ibtn-sm hide-m" type="button" onClick={onToggle} data-tip="Collapse sidebar" aria-label="Collapse sidebar">
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
      <NavLink to="/settings" className={({ isActive }) => `sitem ${isActive ? 'on' : ''}`.trim()}>
        <Icon name="settings" size={16} />
        <span>Settings</span>
      </NavLink>
      <SignOutButton>
        <button className="sitem" type="button" data-tip={collapsed ? 'Sign out' : undefined} data-tip-pos={collapsed ? 'right' : undefined}>
          <Icon name="log-out" size={16} />
          <span>Sign out</span>
        </button>
      </SignOutButton>
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
      </button>
    </div>
  );
}

export function Sidebar({ me, collapsed, onToggle }: SidebarProps) {
  return (
    <nav className={`side ${collapsed ? 'collapsed' : ''}`.trim()} aria-label="Main">
      <SidebarHeader collapsed={collapsed} onToggle={onToggle} />
      <SidebarGroups collapsed={collapsed} />
      <SidebarFooter me={me} collapsed={collapsed} />
    </nav>
  );
}
