'use client';

import { useCallback, useId, useState } from 'react';

import { Button } from '@/app/_components/atoms/button';
import { Textarea } from '@/app/_components/atoms/textarea';
import { Modal } from '@/app/_components/molecules/modal';

interface NoteDialogProps {
  confirmLabel: string;
  confirmVariant?: 'accent' | 'destructive';
  description?: string;
  error: string | null;
  isPending: boolean;
  notePlaceholder?: string;
  noteRequired: boolean;
  onCancel: () => void;
  onConfirm: (note: string) => void;
  title: string;
}

export function NoteDialog({
  confirmLabel,
  confirmVariant = 'accent',
  description = '',
  error,
  isPending,
  notePlaceholder = '',
  noteRequired,
  onCancel,
  onConfirm,
  title,
}: NoteDialogProps): React.ReactElement {
  const noteId = useId();
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleConfirm = useCallback(() => {
    setSubmitted(true);
    const trimmed = note.trim();
    if (noteRequired && trimmed.length === 0) return;
    onConfirm(trimmed);
  }, [note, noteRequired, onConfirm]);

  const showNoteRequiredError = submitted && noteRequired && note.trim().length === 0;

  return (
    <Modal
      description={description}
      footer={(
        <>
          <Button disabled={isPending} onClick={onCancel} type="button" variant="ghost">
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
        </>
      )}
      onClose={onCancel}
      title={title}
    >
      <div className="px-5 pb-5 pt-4">
        <label className="block text-xs font-medium text-slate-700" htmlFor={noteId}>
          {noteRequired ? 'Note (required)' : 'Note (optional)'}
        </label>
        <Textarea
          className="mt-1"
          id={noteId}
          onChange={(event) => setNote(event.target.value)}
          placeholder={notePlaceholder}
          rows={4}
          value={note}
        />
        {showNoteRequiredError ? (
          <p className="mt-2 text-xs text-rose-700">A note is required.</p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
      </div>
    </Modal>
  );
}
