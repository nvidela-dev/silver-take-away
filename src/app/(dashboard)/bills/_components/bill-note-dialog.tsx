'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';

import { Button } from '@/app/_components/ui/button';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface BillNoteDialogProps {
  title: string;
  description?: string;
  confirmLabel: string;
  confirmVariant?: 'accent' | 'destructive';
  noteRequired: boolean;
  notePlaceholder?: string;
  isPending: boolean;
  error: string | null;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function BillNoteDialog({
  title,
  description = '',
  confirmLabel,
  confirmVariant = 'accent',
  noteRequired,
  notePlaceholder = '',
  isPending,
  error,
  onConfirm,
  onCancel,
}: BillNoteDialogProps) {
  const titleId = useId();
  const noteId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const { activeElement } = document;
    const previouslyFocused = activeElement instanceof HTMLElement ? activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const dialogNode = dialogRef.current;
    const focusFirst = () => {
      if (!dialogNode) {
        return;
      }
      const focusables = dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const target = focusables[0] ?? dialogNode;
      target.focus();
    };
    focusFirst();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !dialogNode) {
        return;
      }
      const focusables = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusables.length === 0) {
        event.preventDefault();
        dialogNode.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    const trimmed = note.trim();
    if (noteRequired && trimmed.length === 0) {
      return;
    }
    onConfirm(trimmed);
  }, [note, noteRequired, onConfirm]);

  const showNoteRequiredError = submitted && noteRequired && note.trim().length === 0;

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
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-600">{description}</p>
            ) : null}
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
        <div className="px-5 pb-5 pt-4">
          <label
            className="block text-xs font-medium text-slate-700"
            htmlFor={noteId}
          >
            {noteRequired ? 'Note (required)' : 'Note (optional)'}
          </label>
          <textarea
            className={[
              'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2',
              'text-sm text-slate-950 placeholder:text-slate-400',
              'focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300',
            ].join(' ')}
            id={noteId}
            onChange={(event) => setNote(event.target.value)}
            placeholder={notePlaceholder}
            rows={4}
            value={note}
          />
          {showNoteRequiredError ? (
            <p className="mt-2 text-xs text-rose-700">A note is required.</p>
          ) : null}
          {error ? (
            <p className="mt-2 text-xs text-rose-700">{error}</p>
          ) : null}
        </div>
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
            onClick={handleConfirm}
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
