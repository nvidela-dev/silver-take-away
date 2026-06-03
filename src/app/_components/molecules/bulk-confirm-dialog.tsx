'use client';

import { Button } from '@/app/_components/atoms/button';
import { Modal } from '@/app/_components/molecules/modal';

interface BulkConfirmDialogProps {
  confirmLabel: string;
  confirmVariant?: 'accent' | 'destructive';
  description: string;
  error: string | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function BulkConfirmDialog({
  confirmLabel,
  confirmVariant = 'destructive',
  description,
  error,
  isPending,
  onCancel,
  onConfirm,
  title,
}: BulkConfirmDialogProps): React.ReactElement {
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
            onClick={onConfirm}
            type="button"
            variant={confirmVariant}
          >
            {isPending ? 'Working…' : confirmLabel}
          </Button>
        </>
      )}
      maxWidth="md"
      onClose={onCancel}
      title={title}
    >
      {error ? <p className="px-5 pt-3 text-xs text-rose-700">{error}</p> : null}
    </Modal>
  );
}
