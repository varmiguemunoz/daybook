import { Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '../../stores/ui-store';
import { CommandPalette } from '../../shared/ui/CommandPalette';
import { useBootstrap } from '../../features/workspace/queries';
import { useSSE } from '../../shared/hooks/useSSE';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export function Shell() {
  const { data } = useBootstrap();
  useSSE(data?.workspace.id);
  const { pathname } = useLocation();
  const sidebarOpen = useUiStore(state => state.sidebarOpen);
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const collapsed = !sidebarOpen;

  return (
    <>
      <button className="skip" type="button">
        Skip to content
      </button>
      <div className={`shell ${collapsed ? 'collapsed' : ''}`.trim()}>
        <Sidebar me={data?.me} collapsed={collapsed} onToggle={toggleSidebar} />
        <main className="main" id="main">
          <Topbar me={data?.me} unread={false} />
          <div className="content" id="main-content" tabIndex={-1} data-keep={`c:${pathname}`}>
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>
      <CommandPalette />
    </>
  );
}
