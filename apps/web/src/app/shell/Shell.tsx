import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useUiStore } from '../../stores/ui-store';
import { useBootstrap } from '../../features/workspace/queries';
import { useSSE } from '../../shared/hooks/useSSE';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

export function Shell({ children }: { children: ReactNode }) {
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
        <Sidebar
          workspace={data?.workspace}
          me={data?.me}
          collapsed={collapsed}
          onToggle={toggleSidebar}
        />
        <main className="main" id="main">
          <Topbar me={data?.me} unread={false} />
          <div className="content" id="main-content" tabIndex={-1} data-keep={`c:${pathname}`}>
            {children}
          </div>
        </main>
        <BottomNav />
      </div>
    </>
  );
}
