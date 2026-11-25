import { useEffect } from 'react';
import { useUiStore } from '../../../stores/ui-store';
import { useBootstrap } from '../../workspace/queries';
import { useUpdateMember } from '../../members/queries';
import { ThemeCards, DensityRow } from './ThemeCards';

const DEFAULTS = {
  accent: 'indigo' as const,
  weekStart: 1,
  dateFormat: 'MMM d',
  language: 'en',
  timezone: 'UTC',
  motion: 'system' as const,
  homeRoute: 'home',
};

function buildPreferences(me: { preferences?: Partial<typeof DEFAULTS> }, theme: 'light' | 'dark' | 'system', density: 'comfortable' | 'compact') {
  const p = me.preferences ?? {};
  return {
    theme,
    density,
    accent: p.accent ?? DEFAULTS.accent,
    weekStart: p.weekStart ?? DEFAULTS.weekStart,
    dateFormat: p.dateFormat ?? DEFAULTS.dateFormat,
    language: p.language ?? DEFAULTS.language,
    timezone: p.timezone ?? DEFAULTS.timezone,
    motion: p.motion ?? DEFAULTS.motion,
    homeRoute: p.homeRoute ?? DEFAULTS.homeRoute,
  };
}

export function AppearanceSection() {
  const { data } = useBootstrap();
  const me = data?.me;
  const update = useUpdateMember(me?.id ?? '');
  const theme = useUiStore(state => state.theme);
  const density = useUiStore(state => state.density);

  useEffect(() => {
    if (!me) return;
    update.mutate({ preferences: buildPreferences(me as { preferences?: Partial<typeof DEFAULTS> }, theme, density) });
  }, [theme, density, me, update]);

  return (
    <>
      <h1>Appearance</h1>
      <p className="lead">How Gr8r Studio looks on this device.</p>
      <div className="sblock" style={{ marginTop: 0 }}>
        <h2>Theme</h2>
        <ThemeCards />
      </div>
      <div className="sblock">
        <h2>Density</h2>
        <DensityRow />
      </div>
    </>
  );
}
