import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { z } from 'zod';

import { toBillActionError } from '@/lib/actions/bills/errors';
import { toPaymentActionError } from '@/lib/actions/payments/errors';
import { BillNotFoundError } from '@/lib/repositories/bills';
import { PaymentConflictError } from '@/lib/repositories/payments';

describe('action error mappers', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('maps a known domain error to its code without logging', () => {
    const result = toBillActionError(new BillNotFoundError());

    expect(result).toEqual({
      ok: false,
      error: { code: 'BILL_NOT_FOUND', message: 'Bill was not found.' },
    });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('maps a ZodError to VALIDATION_ERROR without logging', () => {
    const zodError = z.object({ id: z.string() }).safeParse({}).error;

    const result = toBillActionError(zodError);

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs an unexpected error before returning the generic UNKNOWN result', () => {
    const cause = new Error('connection reset');

    const result = toBillActionError(cause);

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: 'Something went wrong while saving the bill.',
      },
    });
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith('[unexpected:bill action]', cause);
  });

  it('uses a caller-supplied context tag when logging', () => {
    const cause = new Error('boom');

    toBillActionError(cause, 'createBill');

    expect(consoleError).toHaveBeenCalledWith('[unexpected:createBill]', cause);
  });

  it('does not leak internals for unexpected payment errors but still logs', () => {
    const cause = new Error('driver timeout');

    const result = toPaymentActionError(cause);

    expect(result).toEqual({
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: 'Something went wrong while updating the payment.',
      },
    });
    expect(consoleError).toHaveBeenCalledWith('[unexpected:payment action]', cause);
  });

  it('maps known payment errors without logging', () => {
    const result = toPaymentActionError(new PaymentConflictError());

    expect(result).toMatchObject({ error: { code: 'PAYMENT_CONFLICT' } });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
