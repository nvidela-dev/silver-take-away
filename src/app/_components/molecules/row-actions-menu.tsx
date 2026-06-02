'use client';

import { EllipsisVertical } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';
import { PopoverPanel } from '@/app/_components/molecules/popover-panel';
import { cn } from '@/lib/utils';

export interface RowAction {
  label: string;
  onSelect: () => void;
  variant?: 'default' | 'destructive';
}

interface RowActionsMenuProps {
  ariaLabel: string;
  actions: RowAction[];
}

export function RowActionsMenu({ ariaLabel, actions }: RowActionsMenuProps) {
  const [isOpen, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  usePopoverDismiss({
    containerRef: menuRef,
    enabled: isOpen,
    onDismiss: () => setOpen(false),
  });

  if (actions.length === 0) return null;

  return (
    <div className="relative inline-flex" ref={menuRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((open) => !open)}
        size="icon"
        type="button"
        variant="ghost"
      >
        <EllipsisVertical aria-hidden className="size-4" />
      </Button>
      {isOpen ? (
        <PopoverPanel align="right">
          <div className="p-1" role="menu">
            {actions.map((action) => (
              <button
                className={cn(
                  'block w-full rounded-sm px-3 py-2 text-left text-xs hover:bg-slate-50',
                  action.variant === 'destructive'
                    ? 'text-rose-700 hover:bg-rose-50'
                    : 'text-slate-700',
                )}
                key={action.label}
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                role="menuitem"
                type="button"
              >
                {action.label}
              </button>
            ))}
          </div>
        </PopoverPanel>
      ) : null}
    </div>
  );
}
