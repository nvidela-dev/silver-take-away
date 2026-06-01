'use client';

import { useCallback, useMemo, useState } from 'react';

import type { DataTableColumn } from '@/app/_components/molecules/data-table';

export interface ColumnVisibility<TRow, TSortKey extends string> {
  configurableColumns: DataTableColumn<TRow, TSortKey>[];
  hiddenIds: Set<string>;
  toggle: (id: string) => void;
  visibleColumns: DataTableColumn<TRow, TSortKey>[];
}

export function useColumnVisibility<TRow, TSortKey extends string>(
  columns: DataTableColumn<TRow, TSortKey>[],
): ColumnVisibility<TRow, TSortKey> {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    configurableColumns,
    hiddenIds,
    toggle,
    visibleColumns,
  };
}
