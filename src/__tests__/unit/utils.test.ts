import { describe, expect, it } from 'vitest';

import { pluralize } from '@/lib/utils';

describe('pluralize', () => {
  it('uses the singular noun for a count of one', () => {
    expect(pluralize(1, 'bill')).toBe('1 bill');
    expect(pluralize(1, 'payment')).toBe('1 payment');
  });

  it('appends "s" for zero and plural counts', () => {
    expect(pluralize(0, 'bill')).toBe('0 bills');
    expect(pluralize(3, 'bill')).toBe('3 bills');
  });

  it('accepts an explicit plural for irregular nouns', () => {
    expect(pluralize(2, 'entry', 'entries')).toBe('2 entries');
    expect(pluralize(1, 'entry', 'entries')).toBe('1 entry');
  });
});
