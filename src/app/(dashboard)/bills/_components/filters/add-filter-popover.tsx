'use client';

import { Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/app/_components/ui/button';

import { usePopoverDismiss } from '../hooks/use-popover-dismiss';
import type { BillFilterDimension } from './bill-filter-dimensions';

interface AddFilterPopoverProps {
  dimensions: readonly BillFilterDimension[];
  onPick: (id: string) => void;
}

export function AddFilterPopover({ dimensions, onPick }: AddFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  usePopoverDismiss({ containerRef, onDismiss: close, enabled: isOpen });

  if (dimensions.length === 0) {
    return null;
  }

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
        <Plus aria-hidden className="size-4" />
        Add filter
      </Button>
      {isOpen ? (
        <div
          className={[
            'absolute left-0 top-full z-30 mt-2 w-56 rounded-md border',
            'border-slate-200 bg-white p-2 shadow-lg',
          ].join(' ')}
          role="menu"
        >
          <ul className="grid">
            {dimensions.map((dimension) => (
              <li key={dimension.id}>
                <button
                  className={[
                    'flex w-full items-center rounded-md px-2 py-1.5 text-left',
                    'text-sm text-slate-800 hover:bg-slate-100',
                  ].join(' ')}
                  onClick={() => {
                    onPick(dimension.id);
                    close();
                  }}
                  type="button"
                >
                  {dimension.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
