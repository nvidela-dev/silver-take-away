'use client';

import { NoteDialog } from '@/app/_components/molecules/note-dialog';

import type {
  PaymentTransitions,
  PendingPaymentTransition,
} from './hooks/use-payment-transitions';

const TRANSITION_DISPLAY = {
  cancel: {
    title: 'Cancel payment',
    confirmLabel: 'Cancel payment',
    confirmVariant: 'destructive' as const,
    noteRequired: false,
    notePlaceholder: 'Optional reason for cancelling this payment.',
  },
  mark_paid: {
    title: 'Mark payment as paid',
    confirmLabel: 'Mark as paid',
    confirmVariant: 'accent' as const,
    noteRequired: false,
    notePlaceholder: 'Optional confirmation reference or context.',
  },
  mark_failed: {
    title: 'Mark payment as failed',
    confirmLabel: 'Mark as failed',
    confirmVariant: 'destructive' as const,
    noteRequired: true,
    notePlaceholder: 'Why did this payment fail?',
  },
} satisfies Record<PendingPaymentTransition['kind'], unknown>;

interface PaymentTransitionDialogProps {
  transitions: PaymentTransitions;
  isPending: boolean;
}

export function PaymentTransitionDialog({
  transitions,
  isPending,
}: PaymentTransitionDialogProps): React.ReactElement | null {
  const {
    pendingTransition,
    transitionError,
    cancelTransition,
    confirmTransition,
  } = transitions;

  if (!pendingTransition) return null;

  const display = TRANSITION_DISPLAY[pendingTransition.kind];

  return (
    <NoteDialog
      confirmLabel={display.confirmLabel}
      confirmVariant={display.confirmVariant}
      description={`Vendor: ${pendingTransition.payment.vendor.name}`}
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
