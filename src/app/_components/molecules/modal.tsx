'use client';

import { X } from 'lucide-react';
import {
  useId,
  useRef,
  type ReactNode,
} from 'react';

import { Button } from '@/app/_components/atoms/button';
import { useDialogBehavior } from '@/app/_components/hooks/use-dialog-behavior';
import { cn } from '@/lib/utils';

interface ModalProps {
  children: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'md' | 'lg' | '5xl';
  onClose: () => void;
  title: ReactNode;
}

const maxWidthClassName = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  '5xl': 'max-w-5xl',
} as const;

export function Modal({
  children,
  description = null,
  footer = null,
  maxWidth = 'lg',
  onClose,
  title,
}: ModalProps): React.ReactElement {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useDialogBehavior({ containerRef: dialogRef, onClose });

  return (
    <div
      aria-labelledby={titleId}
      aria-modal
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 sm:p-6"
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
    >
      <div
        className={cn(
          'w-full rounded-md border border-slate-200 bg-white shadow-2xl',
          maxWidthClassName[maxWidth],
        )}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              {title}
            </h2>
            {description ? (
              <div className="mt-1 text-sm text-slate-600">{description}</div>
            ) : null}
          </div>
          <Button
            aria-label="Close dialog"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden className="size-4" />
          </Button>
        </div>
        {children}
        {footer ? (
          <div
            className={[
              'flex items-center justify-end gap-2 border-t border-slate-200',
              'bg-slate-50 px-5 py-3',
            ].join(' ')}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
