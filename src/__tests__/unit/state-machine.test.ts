import {
  InvalidTransitionError,
  TRANSITION_MAP,
  assertValidTransition,
  canDelete,
  getAvailableActions,
} from '@/lib/services/state-machine';
import {
  DraftBillGuardError,
  assertDraftBillEditable,
} from '@/lib/services/bill-transitions';
import type { BillActionType } from '@/lib/types/bill/actions';
import type { BillStatus } from '@/lib/types/enums';

const ALL_STATUSES: BillStatus[] = [
  'draft',
  'awaiting_approval',
  'approved',
  'scheduled',
  'initiated',
  'paid',
  'archived',
  'rejected',
  'payment_failed',
];

const ALL_ACTIONS: BillActionType[] = [
  'submit_for_approval',
  'approve',
  'reject',
  'schedule_payment',
  'initiate_payment',
  'mark_as_paid',
  'cancel_payment',
  'retry_payment',
  'archive',
  'unschedule',
  'delete',
];

describe('assertValidTransition', () => {
  it.each([
    ['draft', 'submit_for_approval', 'awaiting_approval'],
    ['draft', 'archive', 'archived'],
    ['awaiting_approval', 'approve', 'approved'],
    ['awaiting_approval', 'reject', 'rejected'],
    ['approved', 'schedule_payment', 'scheduled'],
    ['approved', 'mark_as_paid', 'paid'],
    ['approved', 'archive', 'archived'],
    ['scheduled', 'initiate_payment', 'initiated'],
    ['scheduled', 'cancel_payment', 'approved'],
    ['scheduled', 'unschedule', 'approved'],
    ['initiated', 'mark_as_paid', 'paid'],
    ['initiated', 'cancel_payment', 'approved'],
    ['paid', 'archive', 'archived'],
    ['rejected', 'archive', 'archived'],
    ['payment_failed', 'retry_payment', 'initiated'],
    ['payment_failed', 'archive', 'archived'],
  ] as const)(
    '%s + %s -> %s',
    (current, action, expected) => {
      expect(assertValidTransition(current, action)).toBe(expected);
    },
  );

  it('throws InvalidTransitionError when action is not allowed from status', () => {
    expect(() => assertValidTransition('draft', 'approve')).toThrow(
      InvalidTransitionError,
    );
    expect(() => assertValidTransition('paid', 'approve')).toThrow(
      InvalidTransitionError,
    );
    expect(() => assertValidTransition('archived', 'archive')).toThrow(
      InvalidTransitionError,
    );
  });

  it('throws on every combination not in TRANSITION_MAP', () => {
    for (const status of ALL_STATUSES) {
      for (const action of ALL_ACTIONS) {
        type StatusMap = (typeof TRANSITION_MAP)[typeof status];
        const mapped = TRANSITION_MAP[status][action as keyof StatusMap];
        if (mapped) {
          expect(assertValidTransition(status, action)).toBe(mapped);
        } else {
          expect(() => assertValidTransition(status, action)).toThrow(
            InvalidTransitionError,
          );
        }
      }
    }
  });

  it('InvalidTransitionError carries the failing pair and stable code', () => {
    try {
      assertValidTransition('paid', 'approve');
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      const e = err as InvalidTransitionError;
      expect(e.code).toBe('INVALID_TRANSITION');
      expect(e.current).toBe('paid');
      expect(e.action).toBe('approve');
    }
  });
});

describe('getAvailableActions', () => {
  it('returns the configured actions for each non-deletable status', () => {
    expect(new Set(getAvailableActions('awaiting_approval'))).toEqual(
      new Set(['approve', 'reject']),
    );
    expect(new Set(getAvailableActions('scheduled'))).toEqual(
      new Set(['initiate_payment', 'cancel_payment', 'unschedule']),
    );
    expect(new Set(getAvailableActions('archived'))).toEqual(new Set());
  });

  it('includes delete only for draft', () => {
    expect(getAvailableActions('draft')).toContain('delete');
    for (const status of ALL_STATUSES.filter((s) => s !== 'draft')) {
      expect(getAvailableActions(status)).not.toContain('delete');
    }
  });
});

describe('canDelete', () => {
  it('permits delete only from draft', () => {
    expect(canDelete('draft')).toBe(true);
    for (const status of ALL_STATUSES.filter((s) => s !== 'draft')) {
      expect(canDelete(status)).toBe(false);
    }
  });
});

describe('assertDraftBillEditable', () => {
  it('allows draft bill operations', () => {
    expect(() => assertDraftBillEditable({ status: 'draft' })).not.toThrow();
  });

  it('rejects non-draft bill operations with a stable code', () => {
    try {
      assertDraftBillEditable({ status: 'approved' });
      expect.fail('expected throw');
    } catch (err) {
      expect(err).toBeInstanceOf(DraftBillGuardError);
      expect((err as DraftBillGuardError).code).toBe('BILL_NOT_DRAFT');
    }
  });
});
