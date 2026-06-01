import { createBillSchema, draftBillFormSchema } from '@/lib/validators/bill.schemas';

const UUID = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-9222-222222222222';

function baseInput() {
  return {
    vendorId: UUID,
    amount: '100.00',
    invoiceNumber: 'INV-1',
    invoiceDate: '2026-05-01',
    dueDate: '2026-05-31',
    currency: 'USD',
    description: '',
    invoiceUrl: '',
    lineItems: [
      { description: 'A', amount: '60.00', categoryId: UUID_2 },
      { description: 'B', amount: '40.00', categoryId: UUID_2 },
    ],
  };
}

describe('draftBillFormSchema', () => {
  it('accepts a valid draft and trims empty optional strings', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      description: '   ',
      invoiceUrl: '',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('description');
      expect(result.data).not.toHaveProperty('invoiceUrl');
      expect(result.data.currency).toBe('USD');
    }
  });

  it('rejects when line items do not sum to bill amount', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      lineItems: [
        { description: 'A', amount: '50.00', categoryId: UUID_2 },
        { description: 'B', amount: '40.00', categoryId: UUID_2 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const sumIssue = result.error.issues.find((issue) => (
        issue.path.join('.') === 'lineItems'
      ));
      expect(sumIssue?.message).toMatch(/sum/i);
    }
  });

  it('rejects a non-positive bill amount with a field-level issue', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      amount: '0',
      lineItems: [{ description: 'A', amount: '0', categoryId: UUID_2 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const amountIssue = result.error.issues.find((issue) => (
        issue.path.join('.') === 'amount'
      ));
      expect(amountIssue).toBeTruthy();
    }
  });

  it('rejects a non-UUID categoryId', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      lineItems: [
        { description: 'A', amount: '60.00', categoryId: 'not-a-uuid' },
        { description: 'B', amount: '40.00', categoryId: UUID_2 },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => (
        i.path.join('.') === 'lineItems.0.categoryId'
      ));
      expect(issue).toBeTruthy();
    }
  });

  it('rejects a malformed date', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      invoiceDate: '05/01/2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a lowercase currency', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      currency: 'usd',
    });
    expect(result.success).toBe(false);
  });

  it('lets a draft with blank categoryIds submit as a create-bill input', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      lineItems: [
        { description: 'A', amount: '60.00', categoryId: '' },
        { description: 'B', amount: '40.00', categoryId: '' },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(createBillSchema.safeParse(result.data).success).toBe(true);
    }
  });

  it('requires at least one line item', () => {
    const result = draftBillFormSchema.safeParse({
      ...baseInput(),
      lineItems: [],
    });
    expect(result.success).toBe(false);
  });
});
