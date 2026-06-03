'use client';

import { NoteDialog } from '@/app/_components/molecules/note-dialog';

import type { BillTransitions, PendingBillTransition } from './hooks/use-bill-transitions';

const TRANSITION_DISPLAY = {
  approve: {
    title: 'Approve bill',
    confirmLabel: 'Approve bill',
    confirmVariant: 'accent' as const,
    noteRequired: false,
    notePlaceholder: 'Optional context for the approval log.',
  },
  reject: {
    title: 'Reject bill',
    confirmLabel: 'Reject bill',
    confirmVariant: 'destructive' as const,
    noteRequired: true,
    notePlaceholder: 'Why is this bill being rejected?',
  },
} satisfies Record<PendingBillTransition['kind'], unknown>;

interface BillTransitionDialogProps {
  transitions: BillTransitions;
  isPending: boolean;
}

export function BillTransitionDialog({
  transitions,
  isPending,
}: BillTransitionDialogProps): React.ReactElement | null {
  const {
    pendingTransition,
    transitionError,
    cancelTransition,
    confirmTransition,
  } = transitions;

  if (!pendingTransition) {
    return null;
  }

  const display = TRANSITION_DISPLAY[pendingTransition.kind];

  return (
    <NoteDialog
      confirmLabel={display.confirmLabel}
      confirmVariant={display.confirmVariant}
      description={`Vendor: ${pendingTransition.bill.vendor.name}`}
      error={transitionError}
      isPending={isPending}
      noteRequired={display.noteRequired}
      notePlaceholder={display.notePlaceholder}
      onCancel={cancelTransition}
      onConfirm={confirmTransition}
      title={display.title}
    />
  );
}
