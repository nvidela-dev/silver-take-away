'use client';

import { X } from 'lucide-react';
import { useId, useRef } from 'react';

import { Button } from '@/app/_components/atoms/button';

import { useDialogBehavior } from './hooks/use-dialog-behavior';

interface BulkConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'accent' | 'destructive';
  isPending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkConfirmDialog({
  title,
  description,
  confirmLabel,
  confirmVariant = 'destructive',
  isPending,
  error,
  onConfirm,
  onCancel,
}: BulkConfirmDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogBehavior({ containerRef: dialogRef, onClose: onCancel });

  return (
    <div
      aria-labelledby={titleId}
      aria-modal
      className={[
        'fixed inset-0 z-50 grid place-items-center bg-slate-950/50',
        'p-3 sm:p-6',
      ].join(' ')}
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <Button
            aria-label="Close dialog"
            onClick={onCancel}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        {error ? (
          <p className="px-5 pt-3 text-xs text-rose-700">{error}</p>
        ) : null}
        <div
          className={[
            'flex items-center justify-end gap-2 border-t border-slate-200',
            'bg-slate-50 px-5 py-3',
          ].join(' ')}
        >
          <Button
            disabled={isPending}
            onClick={onCancel}
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            type="button"
            variant={confirmVariant}
          >
            {isPending ? 'Working…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
