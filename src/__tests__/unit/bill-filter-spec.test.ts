import {
  billFiltersSchema,
  billPaginationSchema,
  scopedFiltersForTab,
} from '@/lib/validators/bill-filter-spec';

const UUID = '11111111-1111-4111-8111-111111111111';

describe('billFiltersSchema', () => {
  it('normalizes supported URL values', () => {
    const result = billFiltersSchema.parse({
      amountMax: '500.25',
      amountMin: '10',
      search: '  foo  ',
      status: 'draft,approved',
      vendorId: UUID,
    });

    expect(result).toMatchObject({
      amountMax: 500.25,
      amountMin: 10,
      search: 'foo',
      status: ['draft', 'approved'],
      vendorId: UUID,
    });
  });

  it('rejects malformed values', () => {
    expect(billFiltersSchema.safeParse({ status: 'draft,banana' }).success).toBe(false);
    expect(billFiltersSchema.safeParse({ vendorId: 'not-a-uuid' }).success).toBe(false);
    expect(billFiltersSchema.safeParse({ dueDateFrom: '04/01/2026' }).success).toBe(false);
  });
});

describe('scopedFiltersForTab', () => {
  it('drops payment-only filters from draft views', () => {
    expect(scopedFiltersForTab('drafts', {
      search: 'foo',
      status: ['approved'],
    })).toEqual({ search: 'foo' });
  });
});

describe('billPaginationSchema', () => {
  it('defaults to the stable table size', () => {
    expect(billPaginationSchema.parse({})).toEqual({ page: 1, pageSize: 10 });
  });

  it('coerces supported URL values and rejects unsupported sizes', () => {
    expect(billPaginationSchema.parse({ page: '3', pageSize: '50' })).toEqual({
      page: 3,
      pageSize: 50,
    });
    expect(billPaginationSchema.safeParse({ pageSize: '7' }).success).toBe(false);
  });
});
