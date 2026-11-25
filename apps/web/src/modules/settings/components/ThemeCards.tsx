import { Icon } from '../../core/components/Icon';
import type { Theme } from '@daybook/domain';
import { useSetTheme, useTheme } from '../hooks/use-theme';

const THEMES: Array<[Theme, string]> = [
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function ThemeCards() {
  const saved = useTheme();
  const setTheme = useSetTheme();
  const theme = setTheme.isPending ? setTheme.variables : saved;

  return (
    <div className="themecards" style={{ marginTop: 12 }} role="radiogroup" aria-label="Theme">
      {THEMES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          className={`tcard ${theme === value ? 'on' : ''}`.trim()}
          data-theme-preview={value}
          onClick={() => theme !== value && setTheme.mutate(value)}
        >
          <div className="tprev">
            <span className="s" />
            <span className="m" />
          </div>
          <span>{label}</span>
          {theme === value && <Icon name="check" size={14} />}
        </button>
      ))}
    </div>
  );
}
