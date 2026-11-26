import { useState } from 'react';

const KEY = 'daybook-notes-collapsed';

function load(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function useCollapsedFolders() {
  const [collapsed, setCollapsed] = useState(load);

  function toggle(id: string) {
    const next = new Set(collapsed);
    if (!next.delete(id)) next.add(id);
    setCollapsed(next);
    try {
      localStorage.setItem(KEY, JSON.stringify([...next]));
    } catch {
      // Storage can be full or blocked; the tree still works for this visit.
    }
  }

  return { collapsed, toggle };
}
