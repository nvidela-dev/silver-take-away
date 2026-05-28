import {
  billPlaceholderTable,
  billTabs,
  dashboardNavigation,
  paymentPlaceholderTable,
  paymentTabs,
  vendorPlaceholderTable,
} from '@/lib/navigation';

describe('dashboard navigation contracts', () => {
  it('keeps stable primary surfaces for PR-5+ feature work', () => {
    expect(dashboardNavigation.map((item) => item.href)).toEqual([
      '/bills',
      '/payments',
      '/vendors',
    ]);
  });

  it('defines reachable tab contracts for bills and payments', () => {
    expect(billTabs.map((tab) => tab.value)).toEqual([
      'overview',
      'drafts',
      'approvals',
      'payment',
      'history',
    ]);
    expect(paymentTabs.map((tab) => tab.value)).toEqual([
      'overview',
      'needs_review',
      'pending',
      'history',
    ]);
  });

  it('standardizes placeholder table state without shipping rows', () => {
    for (const table of [
      billPlaceholderTable,
      paymentPlaceholderTable,
      vendorPlaceholderTable,
    ]) {
      expect(table.columns.length).toBeGreaterThan(0);
      expect(table.emptyMessage).toEqual(expect.any(String));
      expect(table.title).toEqual(expect.any(String));
    }
  });
});
