import type { ReactNode } from 'react';
import { Icon } from '../../core/components/Icon';

export type CalendarMode = 'month' | 'week';

interface Props {
  mode: CalendarMode;
  label: string;
  onMode: (mode: CalendarMode) => void;
  onShift: (months: number) => void;
  onToday: () => void;
  tools?: ReactNode;
}

export function CalendarToolbar({ mode, label, onMode, onShift, onToday, tools }: Props) {
  return (
    <div className="toolbar" style={{ gap: 8 }}>
      <button className="btn btn-secondary btn-sm" type="button" onClick={onToday}>
        Today
      </button>
      <div className="row" style={{ gap: 0 }}>
        <button className="ibtn ibtn-sm" type="button" onClick={() => onShift(-1)} aria-label="Previous">
          <Icon name="chevron-left" size={16} />
        </button>
        <button className="ibtn ibtn-sm" type="button" onClick={() => onShift(1)} aria-label="Next">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 4px', letterSpacing: '-.01em' }} aria-live="polite">
        {label}
      </h2>
      <span className="sp" />
      {tools}
      <div className="seg">
        {(['month', 'week'] as const).map(value => (
          <button key={value} type="button" className={mode === value ? 'on' : ''} onClick={() => onMode(value)}>
            {value === 'month' ? 'Month' : 'Week'}
          </button>
        ))}
      </div>
    </div>
  );
}
