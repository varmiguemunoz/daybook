import { Icon } from '../../../shared/ui/Icon';
import { useUiStore, type Theme } from '../../../stores/ui-store';

const THEMES: Array<[Theme, string]> = [
  ['light', 'Light'],
  ['dark', 'Dark'],
  ['system', 'System'],
];

export function ThemeCards() {
  const theme = useUiStore(state => state.theme);
  const setTheme = useUiStore(state => state.setTheme);

  return (
    <div className="themecards" style={{ marginTop: 12 }} role="radiogroup" aria-label="Theme">
      {THEMES.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          className={`tcard ${theme === value ? 'on' : ''}`.trim()}
          onClick={() => setTheme(value)}
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

export function DensityRow() {
  const density = useUiStore(state => state.density);
  const setDensity = useUiStore(state => state.setDensity);

  return (
    <div className="srow">
      <div>
        <div className="t">Task display</div>
        <div className="d">Row height in lists and card padding on boards.</div>
      </div>
      <div className="row">
        <div className="seg">
          {(['comfortable', 'compact'] as const).map(value => (
            <button key={value} type="button" className={density === value ? 'on' : ''} onClick={() => setDensity(value)}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
