import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUiStore } from '../../modules/core/states/ui-store';
import { CommandPalette } from '../../modules/search/components/CommandPalette';
import { useBootstrap } from '../../modules/workspace/services/queries';
import { useNotifications } from '../../modules/notifications/services/queries';
import { useSSE } from '../../modules/core/hooks/use-sse';
import { useCurrentDay } from '../../modules/core/hooks/use-current-day';
import { useSessionRecovery } from '../../modules/auth/hooks/use-session-recovery';
import { useApplyTheme } from '../../modules/settings/hooks/use-theme';
import { ErrorBoundary } from '../../modules/core/components/ErrorBoundary';
import { Skeleton } from '../../modules/core/components/Skeleton';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { TaskOverlays } from './TaskOverlays';

function SkipLink() {
  return (
    <a
      className="skip"
      href="#main-content"
      onClick={event => {
        event.preventDefault();
        document.getElementById('main-content')?.focus();
      }}
    >
      Skip to content
    </a>
  );
}

export function Shell() {
  const { data } = useBootstrap();
  useSSE(data?.workspace.id, useSessionRecovery());
  const day = useCurrentDay();
  const { data: unread = [] } = useNotifications(true);
  useApplyTheme();
  const { pathname } = useLocation();
  const sidebarOpen = useUiStore(state => state.sidebarOpen);
  const toggleSidebar = useUiStore(state => state.toggleSidebar);
  const collapsed = !sidebarOpen;

  return (
    <>
      <SkipLink />
      <div className={`shell ${collapsed ? 'collapsed' : ''}`.trim()}>
        <Sidebar me={data?.me} collapsed={collapsed} onToggle={toggleSidebar} />
        <main className="main" id="main">
          <Topbar me={data?.me} unread={unread.length} />
          <div className="content" id="main-content" tabIndex={-1} data-keep={`c:${pathname}`} key={day}>
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<Skeleton lines={8} />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
        <BottomNav />
      </div>
      <CommandPalette />
      <TaskOverlays />
    </>
  );
}
