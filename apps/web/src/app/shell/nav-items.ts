export interface NavEntry {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export const PRIMARY_NAV: NavEntry[] = [
  { to: '/', label: 'Home', icon: 'house', end: true },
  { to: '/notifications', label: 'Notifications', icon: 'bell' },
];

export const WORKSPACE_NAV: NavEntry[] = [
  { to: '/tasks', label: 'Tasks', icon: 'list-checks' },
  { to: '/board', label: 'Board', icon: 'square-kanban' },
  { to: '/table', label: 'Table', icon: 'table-2' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/members', label: 'Members', icon: 'users' },
  { to: '/activity', label: 'Activity', icon: 'activity' },
];
