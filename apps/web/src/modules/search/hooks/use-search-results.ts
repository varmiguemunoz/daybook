import { useEffect, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import type { Member, Task, Team } from '@daybook/domain';
import { apiFetch, queryKeys } from '../../core/services/api-client';
import { useTaskUi } from '../../tasks/states/task-ui-store';

export interface SearchItem {
  id: string;
  group: string;
  label: string;
  sub?: string;
  icon: string;
  run: () => void;
}

interface SearchResult {
  tasks: Task[];
  members: Member[];
  teams: Team[];
}

const MIN_QUERY = 2;
const DEBOUNCE_MS = 200;

const PAGES: Array<[label: string, path: string, icon: string]> = [
  ['Home', '/', 'house'],
  ['Tasks', '/tasks', 'list-checks'],
  ['Board', '/board', 'square-kanban'],
  ['Table', '/table', 'table-2'],
  ['Calendar', '/calendar', 'calendar'],
  ['Members', '/members', 'users'],
  ['Activity', '/activity', 'activity'],
  ['Notifications', '/notifications', 'bell'],
  ['Settings · Workspace', '/settings?section=workspace', 'building-2'],
  ['Settings · Appearance', '/settings?section=appearance', 'palette'],
  ['Settings · Members', '/settings?section=members', 'users'],
  ['Settings · Teams', '/settings?section=teams', 'users-round'],
  ['Settings · Permissions', '/settings?section=permissions', 'shield'],
  ['Settings · Profile', '/settings?section=profile', 'user'],
  ['Settings · Keyboard shortcuts', '/settings?section=shortcuts', 'keyboard'],
];

function useDebounced(value: string): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  return debounced;
}

function useStaticItems(query: string): SearchItem[] {
  const navigate = useNavigate();
  const openComposer = useTaskUi(state => state.openComposer);
  const term = query.trim().toLowerCase();
  const create: SearchItem = { id: 'create-task', group: 'Actions', label: 'Create task', icon: 'plus', run: () => openComposer() };
  const pages = PAGES.map(([label, path, icon]): SearchItem => ({ id: path, group: 'Pages', label, icon, run: () => navigate(path) }));
  return [create, ...pages].filter(item => !term || item.label.toLowerCase().includes(term));
}

function useRemoteItems(query: string): SearchItem[] {
  const navigate = useNavigate();
  const openTask = useTaskUi(state => state.openTask);
  const term = useDebounced(query.trim());
  const enabled = term.length >= MIN_QUERY && query.trim().length >= MIN_QUERY;
  const { data } = useQuery({
    queryKey: queryKeys.search(term),
    queryFn: () => apiFetch<SearchResult>(`/api/search?q=${encodeURIComponent(term)}`),
    enabled,
    placeholderData: keepPreviousData,
  });
  if (!enabled || !data) return [];

  return [
    ...data.tasks.map(task => ({ id: task.id, group: 'Tasks', label: task.title, sub: task.key, icon: 'circle-check', run: () => openTask(task.id) })),
    ...data.members.map(member => ({
      id: member.id,
      group: 'Members',
      label: member.name,
      sub: member.email,
      icon: 'user',
      run: () => navigate('/settings?section=members'),
    })),
    ...data.teams.map(team => ({
      id: team.id,
      group: 'Teams',
      label: team.name,
      icon: team.icon,
      run: () => navigate(`/settings?section=teams&team=${team.id}`),
    })),
  ];
}

export function useSearchResults(query: string): SearchItem[] {
  return [...useStaticItems(query), ...useRemoteItems(query)];
}
