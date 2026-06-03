'use client';

import { Columns3 } from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';

import type { DataTableColumn } from './data-table';
import { PopoverPanel } from './popover-panel';

interface ColumnPickerProps<TRow, TSortKey extends string> {
  columns: DataTableColumn<TRow, TSortKey>[];
  hiddenIds: Set<string>;
  onToggle: (id: string) => void;
}

export function ColumnPicker<TRow, TSortKey extends string>({
  columns,
  hiddenIds,
  onToggle,
}: ColumnPickerProps<TRow, TSortKey>): React.ReactElement | null {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const close = useCallback(() => setIsOpen(false), []);

  usePopoverDismiss({ containerRef, enabled: isOpen, onDismiss: close });

  if (columns.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((prev) => !prev)}
        size="sm"
        type="button"
        variant="outline"
      >
        <Columns3 aria-hidden className="size-4" />
        Columns
      </Button>
      {isOpen ? (
        <PopoverPanel align="right" aria-labelledby={labelId} className="p-2" role="menu">
          <p
            className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-500"
            id={labelId}
          >
            Visible columns
          </p>
          <ul className="grid">
            {columns.map((column) => {
              const isVisible = !hiddenIds.has(column.id);
              const checkboxId = `${labelId}-${column.id}`;
              return (
                <li key={column.id}>
                  <label
                    className={[
                      'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
                      'text-sm text-slate-800 hover:bg-slate-100',
                    ].join(' ')}
                    htmlFor={checkboxId}
                  >
                    <input
                      checked={isVisible}
                      className="size-4 rounded border-slate-300"
                      id={checkboxId}
                      onChange={() => onToggle(column.id)}
                      type="checkbox"
                    />
                    <span>{column.header}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </PopoverPanel>
      ) : null}
    </div>
  );
}
