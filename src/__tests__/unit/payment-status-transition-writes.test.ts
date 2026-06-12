import { beforeEach, vi } from 'vitest';

import type { User } from '@/lib/types/user';

// Mock the database module before importing the repository under test, so the
// drizzle query-builder chains resolve to controllable stubs.
const updateReturning = vi.fn();
const insertValues = vi.fn();

vi.mock('@/db', () => {
  const update = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: updateReturning,
      })),
    })),
  }));
  const insert = vi.fn(() => ({ values: insertValues }));
  return { db: { update, insert } };
});

const {
  applyPaymentStatusTransition,
  applyBulkPaymentStatusTransition,
} = await import('@/lib/repositories/payments/writes');
const { PaymentConflictError, PaymentBulkConflictError } = await import(
  '@/lib/repositories/payments/errors'
);

const actor: User = {
  id: 'actor-1',
  mockUserKey: 'admin',
  email: 'actor@example.com',
  fullName: 'Actor One',
  role: 'admin',
  workspacePreferences: {},
  createdAt: new Date(),
  updatedAt: new Date(),
};

function transitionInput(overrides = {}) {
  return {
    paymentId: 'pay-1',
    currentStatus: 'pending' as const,
    nextStatus: 'initiated' as const,
    action: 'payment_initiated',
    actor,
    ...overrides,
  };
}

beforeEach(() => {
  updateReturning.mockReset();
  insertValues.mockReset();
  insertValues.mockResolvedValue(undefined);
});

describe('applyPaymentStatusTransition', () => {
  it('writes an activity-log entry once the transition lands', async () => {
    updateReturning.mockResolvedValue([{ id: 'pay-1', status: 'initiated' }]);

    const payment = await applyPaymentStatusTransition(transitionInput());

    expect(payment).toEqual({ id: 'pay-1', status: 'initiated' });
    expect(insertValues).toHaveBeenCalledTimes(1);
  });

  it('throws a conflict and writes no log when the guarded update matches nothing', async () => {
    updateReturning.mockResolvedValue([]);

    await expect(applyPaymentStatusTransition(transitionInput())).rejects.toBeInstanceOf(
      PaymentConflictError,
    );
    expect(insertValues).not.toHaveBeenCalled();
  });
});

describe('applyBulkPaymentStatusTransition', () => {
  const bulkInput = (overrides = {}) => ({
    paymentIds: ['pay-1', 'pay-2'],
    currentStatuses: ['pending', 'scheduled'] as const,
    nextStatus: 'initiated' as const,
    action: 'payment_initiated',
    actor,
    ...overrides,
  });

  it('logs only the payments that actually transitioned', async () => {
    updateReturning.mockResolvedValue([
      { id: 'pay-1', status: 'initiated' },
      { id: 'pay-2', status: 'initiated' },
    ]);

    const result = await applyBulkPaymentStatusTransition(bulkInput());

    expect(result).toHaveLength(2);
    expect(insertValues).toHaveBeenCalledTimes(1);
    const loggedRows = insertValues.mock.calls[0][0];
    expect(loggedRows.map((row: { paymentId: string }) => row.paymentId)).toEqual([
      'pay-1',
      'pay-2',
    ]);
  });

  it('logs the matched rows then raises a bulk conflict on a partial match', async () => {
    updateReturning.mockResolvedValue([{ id: 'pay-1', status: 'initiated' }]);

    await expect(applyBulkPaymentStatusTransition(bulkInput())).rejects.toBeInstanceOf(
      PaymentBulkConflictError,
    );
    // The one row that did transition is still logged truthfully.
    const loggedRows = insertValues.mock.calls[0][0];
    expect(loggedRows.map((row: { paymentId: string }) => row.paymentId)).toEqual(['pay-1']);
  });

  it('writes nothing and returns early for an empty id list', async () => {
    const result = await applyBulkPaymentStatusTransition(bulkInput({ paymentIds: [] }));

    expect(result).toEqual([]);
    expect(updateReturning).not.toHaveBeenCalled();
    expect(insertValues).not.toHaveBeenCalled();
  });
});
