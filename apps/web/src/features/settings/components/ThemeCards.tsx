import { Icon } from '../../../shared/ui/Icon';
import { useSetTheme, useTheme, type Theme } from '../theme';

const THEMES: Array<[Theme, string]> = [
  ['light', 'Light'],
  ['dark', 'Dark'],
];

export function ThemeCards() {
  const theme = useTheme();
  const setTheme = useSetTheme();

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
