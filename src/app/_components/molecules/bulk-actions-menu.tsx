'use client';

import { ChevronDown } from 'lucide-react';
import {
  useCallback,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/app/_components/atoms/button';
import { usePopoverDismiss } from '@/app/_components/hooks/use-popover-dismiss';

import { PopoverPanel } from './popover-panel';

export interface BulkActionDescriptor {
  id: string;
  label: string;
  onClick: () => void;
  variant?: 'accent' | 'destructive' | 'outline' | 'secondary';
}

interface BulkActionsMenuProps {
  actions: readonly BulkActionDescriptor[];
  count: number;
  entityLabel: string;
  isPending?: boolean;
  onClear: () => void;
}

const variantClassName: Record<NonNullable<BulkActionDescriptor['variant']>, string> = {
  accent: 'text-slate-950 hover:bg-lime-100',
  destructive: 'text-rose-700 hover:bg-rose-50',
  outline: 'text-slate-800 hover:bg-slate-100',
  secondary: 'text-slate-800 hover:bg-slate-100',
};

export function BulkActionsMenu({
  actions,
  count,
  entityLabel,
  isPending = false,
  onClear,
}: BulkActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const isDisabled = count === 0 || isPending;
  const close = useCallback(() => setIsOpen(false), []);

  usePopoverDismiss({ containerRef, enabled: isOpen, onDismiss: close });

  const handleActionClick = (action: BulkActionDescriptor) => {
    close();
    action.onClick();
  };

  const handleClear = () => {
    close();
    onClear();
  };

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isDisabled}
        onClick={() => setIsOpen((prev) => !prev)}
        size="sm"
        type="button"
        variant="outline"
      >
        Bulk actions
        {count > 0 ? (
          <span
            className={[
              'ml-1 inline-flex min-w-5 items-center justify-center rounded-full',
              'bg-slate-900 px-1.5 text-[10px] font-semibold text-white',
            ].join(' ')}
          >
            {count}
          </span>
        ) : null}
        <ChevronDown aria-hidden className="size-4" />
      </Button>
      {isOpen ? (
        <PopoverPanel align="right" aria-labelledby={labelId} className="w-60 p-2" role="menu">
          <p
            className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-500"
            id={labelId}
          >
            {count}
            {' '}
            {entityLabel}
            {count === 1 ? '' : 's'}
            {' selected'}
          </p>
          <ul className="grid">
            {actions.map((action) => (
              <li key={action.id}>
                <button
                  className={[
                    'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm',
                    variantClassName[action.variant ?? 'secondary'],
                  ].join(' ')}
                  onClick={() => handleActionClick(action)}
                  type="button"
                >
                  {action.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-1 border-t border-slate-100 pt-1">
            <button
              className={[
                'flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm',
                'text-slate-600 hover:bg-slate-100',
              ].join(' ')}
              onClick={handleClear}
              type="button"
            >
              Clear selection
            </button>
          </div>
        </PopoverPanel>
      ) : null}
    </div>
  );
}
