// Navigation primitives: sidebar entries and the per-workspace tab bar.
// The concrete tab unions for bills and payments live here so router-aware
// helpers can use them.

export interface NavigationItem {
  href: string;
  label: string;
  description: string;
  icon?: 'receipt' | 'credit-card';
}

export interface SurfaceTab {
  value: string;
  label: string;
  href: string;
  description: string;
}

export type BillTab = 'overview' | 'drafts' | 'approvals' | 'payment';

export type PaymentTab = 'overview' | 'needs_review' | 'pending' | 'history';
