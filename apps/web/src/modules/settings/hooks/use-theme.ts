import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useUser } from '@clerk/react';
import { THEMES, type Theme } from '@daybook/domain';
import { showToast } from '../../core/components/Toast';

const STORAGE_KEY = 'daybook-theme';

function isTheme(value: unknown): value is Theme {
  return THEMES.includes(value as Theme);
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')?.setAttribute('content', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked; the theme still applies for this session.
  }
}

export function useTheme(): Theme {
  const { user } = useUser();
  const saved = user?.unsafeMetadata.theme;
  if (isTheme(saved)) return saved;
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useApplyTheme(): void {
  const theme = useTheme();
  useEffect(() => applyTheme(theme), [theme]);
}

export function useSetTheme() {
  const { user } = useUser();
  const current = useTheme();

  return useMutation({
    mutationFn: async (theme: Theme) => {
      await user?.update({ unsafeMetadata: { ...user.unsafeMetadata, theme } });
    },
    onMutate: applyTheme,
    onError: () => {
      applyTheme(current);
      showToast('Could not save the theme', 'error');
    },
  });
}
