import { billSortSpec } from '@/lib/validators/bill-sort-spec';

describe('billSortSpec.parseSearchParams', () => {
  it('returns defaults when no params are supplied', () => {
    expect(billSortSpec.parseSearchParams({})).toEqual({
      by: 'invoiceDate',
      dir: 'desc',
    });
  });

  it('parses allowed key + direction', () => {
    expect(billSortSpec.parseSearchParams({ sort: 'amount', dir: 'asc' })).toEqual({
      by: 'amount',
      dir: 'asc',
    });
  });

  it('falls back to defaults when key is not in the allowlist', () => {
    expect(billSortSpec.parseSearchParams({ sort: 'bogus', dir: 'asc' })).toEqual({
      by: 'invoiceDate',
      dir: 'desc',
    });
  });

  it('falls back to defaults when direction is invalid', () => {
    expect(billSortSpec.parseSearchParams({ sort: 'amount', dir: 'sideways' })).toEqual({
      by: 'invoiceDate',
      dir: 'desc',
    });
  });
});
