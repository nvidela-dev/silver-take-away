import {
  approveBillSchema,
  bulkEditBillsSchema,
  createBillSchema,
  rejectBillSchema,
  submitForApprovalSchema,
  updateBillSchema,
} from '@/lib/validators/bill.schemas';
import {
  editPaymentDateSchema,
  schedulePaymentSchema,
} from '@/lib/validators/payment.schemas';
import {
  moneyStringsEqual,
  sumMoneyStrings,
} from '@/lib/validators/shared';
import {
  createVendorSchema,
  setDefaultPaymentMethodSchema,
  updateVendorSchema,
} from '@/lib/validators/vendor.schemas';

const UUID = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-9222-222222222222';

describe('shared money helpers', () => {
  it('sums money strings without float drift', () => {
    expect(sumMoneyStrings(['0.10', '0.20'])).toBe(0.3);
    expect(sumMoneyStrings(['100.00', '0.01', '0.99'])).toBe(101);
    expect(sumMoneyStrings(['9999999999.99'])).toBe(9999999999.99);
  });

  it('compares money strings to 2 decimals', () => {
    expect(moneyStringsEqual('10.00', '10')).toBe(true);
    expect(moneyStringsEqual('10.10', '10.1')).toBe(true);
    expect(moneyStringsEqual('10.10', '10.11')).toBe(false);
  });
});

describe('createBillSchema', () => {
  const validInput = {
    vendorId: UUID,
    amount: '100.00',
    lineItems: [
      { description: 'Item A', amount: '60.00', categoryId: UUID_2 },
      { description: 'Item B', amount: '40.00' },
    ],
  };

  it('accepts a valid bill', () => {
    expect(createBillSchema.safeParse(validInput).success).toBe(true);
  });

  it('rejects missing vendor', () => {
    const { vendorId, ...rest } = validInput;
    void vendorId;
    expect(createBillSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects zero amount', () => {
    const result = createBillSchema.safeParse({ ...validInput, amount: '0' });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = createBillSchema.safeParse({ ...validInput, amount: '-1.00' });
    expect(result.success).toBe(false);
  });

  it('rejects amount with more than 2 fractional digits', () => {
    const result = createBillSchema.safeParse({ ...validInput, amount: '10.001' });
    expect(result.success).toBe(false);
  });

  it('accepts the boundary numeric(12,2) maximum', () => {
    const result = createBillSchema.safeParse({
      ...validInput,
      amount: '9999999999.99',
      lineItems: [{ amount: '9999999999.99' }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when line item sum does not equal bill total', () => {
    const result = createBillSchema.safeParse({
      ...validInput,
      lineItems: [
        { amount: '60.00' },
        { amount: '30.00' }, // sum = 90, total = 100
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.issues[0]?.message ?? '';
      expect(message).toMatch(/sum/i);
    }
  });

  it('requires at least one line item', () => {
    const result = createBillSchema.safeParse({ ...validInput, lineItems: [] });
    expect(result.success).toBe(false);
  });

  it('defaults currency to USD', () => {
    const result = createBillSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
    }
  });

  it('rejects non-ISO currency codes', () => {
    const result = createBillSchema.safeParse({ ...validInput, currency: 'usd' });
    expect(result.success).toBe(false);
  });
});

describe('updateBillSchema', () => {
  it('allows partial updates without line items', () => {
    const result = updateBillSchema.safeParse({
      id: UUID,
      description: 'updated',
    });
    expect(result.success).toBe(true);
  });

  it('validates line item sum when both amount and lineItems are present', () => {
    const result = updateBillSchema.safeParse({
      id: UUID,
      amount: '100.00',
      lineItems: [{ amount: '50.00' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts matching sum', () => {
    const result = updateBillSchema.safeParse({
      id: UUID,
      amount: '100.00',
      lineItems: [{ amount: '70.00' }, { amount: '30.00' }],
    });
    expect(result.success).toBe(true);
  });
});

describe('bulkEditBillsSchema', () => {
  it('requires at least one editable field', () => {
    const result = bulkEditBillsSchema.safeParse({ billIds: [UUID] });
    expect(result.success).toBe(false);
  });

  it('accepts a partial edit', () => {
    const result = bulkEditBillsSchema.safeParse({
      billIds: [UUID, UUID_2],
      dueDate: '2026-03-05',
    });
    expect(result.success).toBe(true);
  });
});

describe('submitForApprovalSchema', () => {
  it('accepts billId only', () => {
    expect(submitForApprovalSchema.safeParse({ billId: UUID }).success).toBe(true);
  });

  it('accepts billId with expectedUpdatedAt', () => {
    expect(
      submitForApprovalSchema.safeParse({
        billId: UUID,
        expectedUpdatedAt: '2026-05-30T15:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('rejects bad uuids', () => {
    expect(
      submitForApprovalSchema.safeParse({ billId: 'not-a-uuid' }).success,
    ).toBe(false);
  });
});

describe('approveBillSchema', () => {
  it('accepts billId only (note optional)', () => {
    expect(approveBillSchema.safeParse({ billId: UUID }).success).toBe(true);
  });

  it('accepts billId with a note', () => {
    expect(
      approveBillSchema.safeParse({ billId: UUID, note: 'looks good' }).success,
    ).toBe(true);
  });

  it('rejects notes longer than 1000 chars', () => {
    expect(
      approveBillSchema.safeParse({ billId: UUID, note: 'a'.repeat(1001) })
        .success,
    ).toBe(false);
  });
});

describe('rejectBillSchema', () => {
  it('requires a non-empty note', () => {
    expect(rejectBillSchema.safeParse({ billId: UUID }).success).toBe(false);
    expect(
      rejectBillSchema.safeParse({ billId: UUID, note: '' }).success,
    ).toBe(false);
    expect(
      rejectBillSchema.safeParse({ billId: UUID, note: 'missing receipts' })
        .success,
    ).toBe(true);
  });

  it('rejects notes longer than 1000 chars', () => {
    expect(
      rejectBillSchema.safeParse({ billId: UUID, note: 'a'.repeat(1001) })
        .success,
    ).toBe(false);
  });
});

describe('schedulePaymentSchema', () => {
  it('accepts a complete schedule input', () => {
    const result = schedulePaymentSchema.safeParse({
      billId: UUID,
      paymentMethod: 'ach',
      scheduledDate: '2026-04-01',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = schedulePaymentSchema.safeParse({
      billId: UUID,
      paymentMethod: 'wire',
      scheduledDate: '04/01/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid payment method', () => {
    const result = schedulePaymentSchema.safeParse({
      billId: UUID,
      paymentMethod: 'crypto',
      scheduledDate: '2026-04-01',
    });
    expect(result.success).toBe(false);
  });
});

describe('editPaymentDateSchema', () => {
  it('accepts valid input', () => {
    expect(
      editPaymentDateSchema.safeParse({
        paymentId: UUID,
        scheduledDate: '2026-05-19',
      }).success,
    ).toBe(true);
  });
});

describe('createVendorSchema', () => {
  it('accepts a minimal vendor', () => {
    expect(createVendorSchema.safeParse({ name: 'Acme' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createVendorSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(
      createVendorSchema.safeParse({ name: 'Acme', email: 'not-an-email' })
        .success,
    ).toBe(false);
  });

  it('rejects more than one default payment method', () => {
    const result = createVendorSchema.safeParse({
      name: 'Acme',
      paymentMethods: [
        { methodType: 'ach', isDefault: true },
        { methodType: 'wire', isDefault: true },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects malformed account_number_last4', () => {
    const result = createVendorSchema.safeParse({
      name: 'Acme',
      paymentMethods: [{ methodType: 'ach', accountNumberLast4: '12' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateVendorSchema', () => {
  it('requires at least one field to change', () => {
    expect(updateVendorSchema.safeParse({ id: UUID }).success).toBe(false);
  });

  it('accepts clearing the owner via null', () => {
    expect(
      updateVendorSchema.safeParse({ id: UUID, ownerId: null }).success,
    ).toBe(true);
  });
});

describe('setDefaultPaymentMethodSchema', () => {
  it('requires both ids', () => {
    expect(
      setDefaultPaymentMethodSchema.safeParse({
        vendorId: UUID,
        paymentMethodId: UUID_2,
      }).success,
    ).toBe(true);
    expect(
      setDefaultPaymentMethodSchema.safeParse({ vendorId: UUID }).success,
    ).toBe(false);
  });
});
