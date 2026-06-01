'use client';

import { ChevronDown } from 'lucide-react';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { Button } from '@/app/_components/atoms/button';

export interface BulkActionDescriptor {
  id: string;
  label: string;
  variant?: 'accent' | 'destructive' | 'outline' | 'secondary';
  onClick: () => void;
}

interface BillsBulkActionsMenuProps {
  count: number;
  actions: readonly BulkActionDescriptor[];
  onClear: () => void;
  isPending?: boolean;
}

const variantClassName: Record<NonNullable<BulkActionDescriptor['variant']>, string> = {
  accent: 'text-slate-950 hover:bg-lime-100',
  destructive: 'text-rose-700 hover:bg-rose-50',
  outline: 'text-slate-800 hover:bg-slate-100',
  secondary: 'text-slate-800 hover:bg-slate-100',
};

export function BillsBulkActionsMenu({
  count,
  actions,
  onClear,
  isPending = false,
}: BillsBulkActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const isDisabled = count === 0 || isPending;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      const node = containerRef.current;
      if (node && !node.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleActionClick = (action: BulkActionDescriptor) => {
    setIsOpen(false);
    action.onClick();
  };

  const handleClear = () => {
    setIsOpen(false);
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
        <div
          aria-labelledby={labelId}
          className={[
            'absolute right-0 top-full z-30 mt-2 w-60 rounded-md border border-slate-200',
            'bg-white p-2 shadow-lg',
          ].join(' ')}
          role="menu"
        >
          <p
            className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wide text-slate-500"
            id={labelId}
          >
            {count}
            {' '}
            {count === 1 ? 'bill' : 'bills'}
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
        </div>
      ) : null}
    </div>
  );
}
