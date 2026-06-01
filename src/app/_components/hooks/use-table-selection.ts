'use client';

import {
  useCallback,
  useMemo,
  useState,
} from 'react';

export interface TableSelection {
  clear: () => void;
  isAllSelected: boolean;
  isSelected: (id: string) => boolean;
  isSomeSelected: boolean;
  selectedCount: number;
  selectedIds: ReadonlySet<string>;
  toggle: (id: string) => void;
  toggleAll: () => void;
}

export function useTableSelection(visibleIds: readonly string[]): TableSelection {
  const [rawSelected, setRawSelected] = useState<ReadonlySet<string>>(() => new Set());
  const visibleSet = useMemo(() => new Set(visibleIds), [visibleIds]);

  const selectedIds = useMemo(() => {
    const next = new Set<string>();
    rawSelected.forEach((id) => {
      if (visibleSet.has(id)) {
        next.add(id);
      }
    });
    return next;
  }, [rawSelected, visibleSet]);

  const toggle = useCallback((id: string) => {
    setRawSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setRawSelected((prev) => {
      const allVisibleSelected = visibleIds.length > 0
        && visibleIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }, [visibleIds]);

  const clear = useCallback(() => setRawSelected(new Set()), []);
  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const isAllSelected = visibleIds.length > 0
    && visibleIds.every((id) => selectedIds.has(id));
  const isSomeSelected = !isAllSelected
    && visibleIds.some((id) => selectedIds.has(id));

  return {
    clear,
    isAllSelected,
    isSelected,
    isSomeSelected,
    selectedCount: selectedIds.size,
    selectedIds,
    toggle,
    toggleAll,
  };
}
