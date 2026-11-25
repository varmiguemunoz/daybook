import { useState } from 'react';

export function useTaskSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const selectedIds = visibleIds.filter(id => selected.has(id));
  const allSelected = visibleIds.length > 0 && selectedIds.length === visibleIds.length;

  function toggle(id: string) {
    setSelected(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return {
    selectedIds,
    allSelected,
    isSelected: (id: string) => selected.has(id),
    toggle,
    toggleAll: () => setSelected(allSelected ? new Set() : new Set(visibleIds)),
    clear: () => setSelected(new Set()),
  };
}
