import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker, type Location } from 'react-router-dom';

const noteOf = (location: Location) => new URLSearchParams(location.search).get('note');

// Blocks leaving the open note (another note, another page, the back button or closing the tab) while it has unsaved edits.
export function useUnsavedGuard() {
  const dirty = useRef(false);
  const settled = useRef(false);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty.current && (currentLocation.pathname !== nextLocation.pathname || noteOf(currentLocation) !== noteOf(nextLocation)),
  );

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (dirty.current) event.preventDefault();
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const setDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);

  // For actions that are not navigations, such as creating a note.
  const run = useCallback((action: () => void) => {
    if (dirty.current) setPending(() => action);
    else action();
  }, []);

  function confirm() {
    settled.current = true;
    dirty.current = false;
    if (blocker.state === 'blocked') blocker.proceed();
    pending?.();
    setPending(null);
  }

  // ConfirmDialog closes after confirming; that close must not reset a navigation that is already proceeding.
  function cancel() {
    if (settled.current) {
      settled.current = false;
      return;
    }
    if (blocker.state === 'blocked') blocker.reset();
    setPending(null);
  }

  return { setDirty, run, pending: pending !== null || blocker.state === 'blocked', confirm, cancel };
}
