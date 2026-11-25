import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Member, Preferences } from '@gr8r/domain';
import { apiFetch, queryKeys } from '../../shared/api/client';
import { showToast } from '../../shared/ui/Toast';
import { useBootstrap, type Bootstrap } from '../workspace/queries';

export type Theme = Preferences['theme'];

export function useTheme(): Theme {
  const { data } = useBootstrap();
  return data?.me.preferences?.theme === 'dark' ? 'dark' : 'light';
}

export function useApplyTheme(): void {
  const theme = useTheme();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
}

function withTheme(bootstrap: Bootstrap | undefined, theme: Theme): Bootstrap | undefined {
  if (!bootstrap) return bootstrap;
  const preferences = { ...bootstrap.me.preferences, theme } as Member['preferences'];
  return { ...bootstrap, me: { ...bootstrap.me, preferences } };
}

export function useSetTheme() {
  const client = useQueryClient();
  const { data } = useBootstrap();

  return useMutation<Member, Error, Theme, { previous?: Bootstrap }>({
    mutationFn: theme => apiFetch<Member>(`/api/members/${data?.me.id}`, { method: 'PATCH', body: JSON.stringify({ preferences: { theme } }) }),
    onMutate: async theme => {
      await client.cancelQueries({ queryKey: queryKeys.bootstrap });
      const previous = client.getQueryData<Bootstrap>(queryKeys.bootstrap);
      client.setQueryData<Bootstrap | undefined>(queryKeys.bootstrap, current => withTheme(current, theme));
      return { previous };
    },
    onError: (_error, _theme, snapshot) => {
      client.setQueryData(queryKeys.bootstrap, snapshot?.previous);
      showToast('Could not save the theme', 'error');
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.bootstrap }),
  });
}
