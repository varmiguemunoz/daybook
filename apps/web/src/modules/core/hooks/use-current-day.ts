import { useEffect, useState } from 'react';
import { addDays, isoDate, today } from '../utils/dates';

export function useCurrentDay(): string {
  const [day, setDay] = useState(() => isoDate(today()));

  useEffect(() => {
    const untilMidnight = addDays(today(), 1).getTime() - Date.now();
    const timer = setTimeout(() => setDay(isoDate(today())), untilMidnight + 1_000);
    return () => clearTimeout(timer);
  }, [day]);

  return day;
}
