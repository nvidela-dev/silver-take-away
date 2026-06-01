'use client';

import { X } from 'lucide-react';

import { Button } from '@/app/_components/atoms/button';

export interface BulkActionDescriptor {
  id: string;
  label: string;
  variant?: 'accent' | 'destructive' | 'outline' | 'secondary';
  onClick: () => void;
}

interface BillsBulkActionsBarProps {
  count: number;
  actions: readonly BulkActionDescriptor[];
  onClear: () => void;
  isPending?: boolean;
}

export function BillsBulkActionsBar({
  count,
  actions,
  onClear,
  isPending = false,
}: BillsBulkActionsBarProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div
      className={[
        'flex flex-wrap items-center gap-3 rounded-md border border-slate-200',
        'bg-slate-50 px-3 py-2',
      ].join(' ')}
      role="toolbar"
      aria-label="Bulk actions"
    >
      <div className="text-sm font-medium text-slate-950">
        {count}
        {' '}
        {count === 1 ? 'bill' : 'bills'}
        {' selected'}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            disabled={isPending}
            key={action.id}
            onClick={action.onClick}
            size="sm"
            type="button"
            variant={action.variant ?? 'secondary'}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <Button
        aria-label="Clear selection"
        className="ml-auto"
        disabled={isPending}
        onClick={onClear}
        size="icon"
        type="button"
        variant="ghost"
      >
        <X aria-hidden className="size-4" />
      </Button>
    </div>
  );
}
