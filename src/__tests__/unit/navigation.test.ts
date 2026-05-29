import {
  billTabs,
  dashboardNavigation,
  paymentPlaceholderTable,
  paymentTabs,
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
    ]);
    expect(paymentTabs.map((tab) => tab.value)).toEqual([
      'overview',
      'needs_review',
      'pending',
      'history',
    ]);
  });

  it('keeps payment placeholder table state until payment data lands', () => {
    expect(paymentPlaceholderTable.columns.length).toBeGreaterThan(0);
    expect(paymentPlaceholderTable.emptyMessage).toEqual(expect.any(String));
    expect(paymentPlaceholderTable.title).toEqual(expect.any(String));
  });
});
