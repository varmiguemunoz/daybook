import { Link, useLocation } from 'react-router-dom';
import type { Member } from '@gr8r/domain';
import { Icon } from '../../shared/ui/Icon';
import { Avatar } from '../../shared/ui/Avatar';
import { useUiStore } from '../../stores/ui-store';
import { PRIMARY_NAV, WORKSPACE_NAV } from './nav-items';

const MOD = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘' : 'Ctrl';

function labelFor(pathname: string): string {
  const match = [...WORKSPACE_NAV, ...PRIMARY_NAV].find(entry => entry.to === pathname);
  if (match) return match.label;
  if (pathname.startsWith('/settings')) return 'Settings';
  if (pathname.startsWith('/teams')) return 'Teams';
  return 'Home';
}

function Breadcrumbs() {
  const { pathname } = useLocation();
  const label = labelFor(pathname);

  return (
    <nav className="crumbs trunc" aria-label="Breadcrumb">
      {pathname === '/' ? (
        <button className="cur">{label}</button>
      ) : (
        <>
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <button className="cur">{label}</button>
        </>
      )}
    </nav>
  );
}

export function Topbar({ me, unread }: { me?: Member; unread: boolean }) {
  const openPalette = useUiStore(state => state.setCommandPaletteOpen);

  return (
    <header className="topbar">
      <Breadcrumbs />
      <span className="sp" />
      <button className="topsearch" type="button" onClick={() => openPalette(true)} aria-label="Search and commands">
        <Icon name="search" size={14} />
        <span className="lbltxt">Search or jump to…</span>
        <span className="kbd">{MOD}K</span>
      </button>
      <Link to="/notifications" className="ibtn" data-tip="Notifications" aria-label="Notifications">
        <Icon name="bell" size={16} />
        {unread && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 7,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 0 2px var(--surface)',
            }}
          />
        )}
      </Link>
      <button className="btn btn-secondary btn-sm" type="button" aria-label="Create new">
        <Icon name="plus" size={14} />
        <span className="hide-m">New</span>
        <Icon name="chevron-down" size={12} className="hide-m" />
      </button>
      <button className="ibtn hide-m" type="button" aria-label="Account menu" style={{ width: 'auto', padding: '0 2px' }}>
        <Avatar member={me} className="md" tip={false} />
      </button>
    </header>
  );
}
