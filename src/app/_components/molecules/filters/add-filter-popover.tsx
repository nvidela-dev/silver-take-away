'use client';

import { Plus } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';

import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';

import { PopoverPanel } from '../popover-panel';

export interface FilterOption {
  id: string;
  label: string;
}

interface AddFilterPopoverProps<TOption extends FilterOption> {
  dimensions: readonly TOption[];
  onPick: (id: string) => void;
}

export function AddFilterPopover<TOption extends FilterOption>({
  dimensions,
  onPick,
}: AddFilterPopoverProps<TOption>) {
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
        <PopoverPanel className="p-2" role="menu">
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
        </PopoverPanel>
      ) : null}
    </div>
  );
}
