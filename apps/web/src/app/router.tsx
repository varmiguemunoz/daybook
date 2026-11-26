import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireSession } from '../modules/auth/components/RequireSession';
import { RequireOrganization } from '../modules/organizations/components/RequireOrganization';
import { Shell } from './shell/Shell';

const AuthPage = lazy(() => import('../pages/AuthPage').then(module => ({ default: module.AuthPage })));
const HomePage = lazy(() => import('../pages/HomePage').then(module => ({ default: module.HomePage })));
const TasksPage = lazy(() => import('../pages/TasksPage').then(module => ({ default: module.TasksPage })));
const BoardPage = lazy(() => import('../pages/BoardPage').then(module => ({ default: module.BoardPage })));
const TablePage = lazy(() => import('../pages/TablePage').then(module => ({ default: module.TablePage })));
const CalendarPage = lazy(() => import('../pages/CalendarPage').then(module => ({ default: module.CalendarPage })));
const MembersPage = lazy(() => import('../pages/MembersPage').then(module => ({ default: module.MembersPage })));
const ActivityPage = lazy(() => import('../pages/ActivityPage').then(module => ({ default: module.ActivityPage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const NotesPage = lazy(() => import('../pages/NotesPage').then(module => ({ default: module.NotesPage })));
const SettingsPage = lazy(() => import('../pages/SettingsPage').then(module => ({ default: module.SettingsPage })));

export function AppRoutes() {
  return (
    <Suspense fallback={<div className="auth" aria-busy="true" />}>
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
              <Route path="notes" element={<NotesPage />} />
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
    </Suspense>
  );
}
