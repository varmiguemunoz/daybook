import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireSession } from '../features/auth/RequireSession';
import { RequireOrganization } from '../features/organizations/RequireOrganization';
import { AuthPage } from '../pages/AuthPage';
import { HomePage } from '../pages/HomePage';
import { TasksPage } from '../pages/TasksPage';
import { BoardPage } from '../pages/BoardPage';
import { TablePage } from '../pages/TablePage';
import { CalendarPage } from '../pages/CalendarPage';
import { MembersPage } from '../pages/MembersPage';
import { ActivityPage } from '../pages/ActivityPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { Shell } from './shell/Shell';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth/*" element={<AuthPage />} />
      <Route element={<RequireSession />}>
        <Route element={<RequireOrganization />}>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="table" element={<TablePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="members" element={<MembersPage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="teams" element={<MembersPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
