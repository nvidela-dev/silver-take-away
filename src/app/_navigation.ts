import type {
  NavigationItem,
  SurfaceTab,
} from '@/app/_types/navigation';

export const dashboardNavigation = [
  {
    href: '/bills',
    label: 'Bills',
    description: 'Primary queue for intake, approvals, and payment readiness.',
    icon: 'receipt',
  },
  {
    href: '/payments',
    label: 'Payments',
    description: 'Payment objects after bill approval: pending, paid, failed, and cancelled.',
    icon: 'credit-card',
  },
] as const satisfies readonly NavigationItem[];

export const billTabs = [
  {
    value: 'overview',
    label: 'Overview',
    href: '/bills?tab=overview',
    description: 'Bills grouped by operational status.',
  },
  {
    value: 'drafts',
    label: 'Drafts',
    href: '/bills?tab=drafts',
    description: 'Bills being prepared before approval.',
  },
  {
    value: 'approvals',
    label: 'For approval',
    href: '/bills?tab=approvals',
    description: 'Bills currently awaiting approval decisions.',
  },
  {
    value: 'payment',
    label: 'For payment',
    href: '/bills?tab=payment',
    description: 'Approved bills ready to schedule or release for payment.',
  },
] as const satisfies readonly SurfaceTab[];

export const paymentTabs = [
  {
    value: 'upcoming',
    label: 'Upcoming',
    href: '/payments?tab=upcoming',
    description: 'Payments pending or scheduled for release.',
  },
  {
    value: 'processing',
    label: 'Processing',
    href: '/payments?tab=processing',
    description: 'Payments initiated or in transit with the processor.',
  },
  {
    value: 'completed',
    label: 'Completed',
    href: '/payments?tab=completed',
    description: 'Paid, failed, and cancelled payments.',
  },
] as const satisfies readonly SurfaceTab[];
