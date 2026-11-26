import { useEffect } from 'react';

const AUTOSAVE_MS = 1500;

// Saves a pause after the last keystroke; each change restarts the wait.
export function useAutosave(enabled: boolean, draft: unknown, save: () => void) {
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(save, AUTOSAVE_MS);
    return () => clearTimeout(timer);
    // Only a new draft restarts the wait; the save callback changes on every render.
  }, [enabled, draft]);
}
