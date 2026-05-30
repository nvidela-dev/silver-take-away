'use client';

import { useCallback, useMemo, useState } from 'react';

import type { BillsTableColumn } from '../bills-table';

export interface ColumnVisibility {
  visibleColumns: BillsTableColumn[];
  configurableColumns: BillsTableColumn[];
  hiddenIds: Set<string>;
  toggle: (id: string) => void;
}

export function useColumnVisibility(columns: BillsTableColumn[]): ColumnVisibility {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const configurableColumns = useMemo(
    () => columns.filter((column) => column.isConfigurable !== false),
    [columns],
  );

  const visibleColumns = useMemo(
    () => columns.filter((column) => (
      column.isConfigurable === false || !hiddenIds.has(column.id)
    )),
    [columns, hiddenIds],
  );

  return {
    visibleColumns,
    configurableColumns,
    hiddenIds,
    toggle,
  };
}
