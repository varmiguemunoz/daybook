import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SignIn } from '@clerk/clerk-react';
import { BoardPage } from '../features/views/components/BoardPage';
import { TablePage } from '../features/views/components/TablePage';
import { CalendarPage } from '../features/views/components/CalendarPage';
import { FilesPage } from '../features/views/components/FilesPage';
import { MembersPage } from '../features/members/components/MembersPage';
import { ActivityPage } from '../features/activity/components/ActivityPage';
import { NotificationsPage } from '../features/notifications/components/NotificationsPage';
import { SettingsPage } from '../features/settings/components/SettingsPage';
import { HomePage } from '../features/home/components/HomePage';
import { TasksPage } from '../features/tasks/components/TasksPage';
import { Shell } from './shell/Shell';

const hasClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in/*" element={hasClerk ? <SignIn /> : <HomePage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/table" element={<TablePage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/files" element={<FilesPage />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/teams" element={<MembersPage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Shell>
        <AppRoutes />
      </Shell>
    </BrowserRouter>
  );
}
