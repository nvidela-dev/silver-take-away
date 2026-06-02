'use client';

import { useCallback, useMemo, useState } from 'react';

import type { DataTableColumn } from '@/app/_components/molecules/data-table';

export interface ColumnVisibility<TRow, TSortKey extends string> {
  configurableColumns: DataTableColumn<TRow, TSortKey>[];
  hiddenIds: Set<string>;
  toggle: (id: string) => void;
  setHidden: (ids: readonly string[]) => void;
  visibleColumns: DataTableColumn<TRow, TSortKey>[];
}

export function useColumnVisibility<TRow, TSortKey extends string>(
  columns: DataTableColumn<TRow, TSortKey>[],
  initialHiddenIds: readonly string[] = [],
): ColumnVisibility<TRow, TSortKey> {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set(initialHiddenIds));

  const toggle = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setHidden = useCallback((ids: readonly string[]) => {
    setHiddenIds(new Set(ids));
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
    configurableColumns,
    hiddenIds,
    toggle,
    setHidden,
    visibleColumns,
  };
}
