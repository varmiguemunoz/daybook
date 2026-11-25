import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { Popover } from './Popover';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

function toIso(date: Date | undefined): string {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fromIso(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function DatePicker({ value, onChange, label = 'Due date' }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);

  return (
    <>
      <button ref={setAnchor} type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(current => !current)} aria-label={label}>
        <Icon name="calendar" size={13} />
        {value || 'Set date'}
      </button>
      <Popover open={open} anchor={anchor} onClose={() => setOpen(false)}>
        <DayPicker
          mode="single"
          selected={fromIso(value)}
          onSelect={date => {
            onChange(toIso(date));
            setOpen(false);
          }}
        />
      </Popover>
    </>
  );
}
