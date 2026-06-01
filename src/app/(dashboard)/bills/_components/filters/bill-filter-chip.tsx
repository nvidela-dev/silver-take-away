'use client';

import { X } from 'lucide-react';
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@/app/_components/atoms/button';

import { usePopoverDismiss } from '../hooks/use-popover-dismiss';

interface BillFilterChipProps {
  label: string;
  valueSummary: string;
  onClear: () => void;
  initialOpen?: boolean;
  renderEditor: (close: () => void) => ReactNode;
}

export function BillFilterChip({
  label,
  valueSummary,
  onClear,
  initialOpen = false,
  renderEditor,
}: BillFilterChipProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setIsOpen(false), []);
  usePopoverDismiss({ containerRef, onDismiss: close, enabled: isOpen });

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={[
          'inline-flex items-center gap-1 rounded-full border border-slate-300',
          'bg-white text-xs',
        ].join(' ')}
      >
        <button
          className={[
            'flex items-center gap-1 rounded-l-full px-3 py-1',
            'text-slate-800 hover:bg-slate-100',
          ].join(' ')}
          onClick={() => setIsOpen((prev) => !prev)}
          type="button"
        >
          <span className="font-medium">{`${label}:`}</span>
          <span className="text-slate-600">{valueSummary}</span>
        </button>
        <Button
          aria-label={`Remove ${label} filter`}
          className="rounded-r-full"
          onClick={onClear}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden className="size-3" />
        </Button>
      </div>
      {isOpen ? (
        <div
          className={[
            'absolute left-0 top-full z-30 mt-2 w-72 rounded-md border',
            'border-slate-200 bg-white shadow-lg',
          ].join(' ')}
          role="dialog"
        >
          {renderEditor(close)}
        </div>
      ) : null}
    </div>
  );
}
