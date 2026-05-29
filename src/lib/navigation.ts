import type {
  NavigationItem,
  PlaceholderTableState,
  SurfaceTab,
} from '@/types';

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
    value: 'overview',
    label: 'Overview',
    href: '/payments',
    description: 'Payment counts and operational summary.',
  },
  {
    value: 'needs_review',
    label: 'Needs review',
    href: '/payments?tab=needs_review',
    description: 'Payments needing user attention.',
  },
  {
    value: 'pending',
    label: 'Pending',
    href: '/payments?tab=pending',
    description: 'Scheduled and in-flight payments.',
  },
  {
    value: 'history',
    label: 'History',
    href: '/payments?tab=history',
    description: 'Completed, failed, and cancelled payments.',
  },
] as const satisfies readonly SurfaceTab[];

export const paymentPlaceholderTable = {
  title: 'Payments table shell',
  description: [
    'Payment workspace contracts are fixed here',
    'before payment behavior lands.',
  ].join(' '),
  emptyMessage: 'Payment data wiring starts in the payments feature PR.',
  columns: [
    {
      id: 'select',
      label: '',
      isConfigurable: false,
    },
    {
      id: 'vendor',
      label: 'Vendor',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'bill',
      label: 'Bill',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'status',
      label: 'Status',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'paymentDate',
      label: 'Payment Date',
      isSortable: true,
      isConfigurable: true,
    },
  ],
  actions: [
    {
      id: 'view',
      label: 'View detail',
    },
    {
      id: 'cancel',
      label: 'Cancel',
      tone: 'rose',
      isDestructive: true,
    },
    {
      id: 'release',
      label: 'Release payment',
      tone: 'blue',
    },
    {
      id: 'editDate',
      label: 'Edit payment date',
      tone: 'sky',
    },
    {
      id: 'retry',
      label: 'Retry payment',
      tone: 'amber',
    },
    {
      id: 'unschedule',
      label: 'Unschedule',
      tone: 'slate',
    },
  ],
  bulkActions: [
    {
      id: 'cancel',
      label: 'Cancel selected',
      tone: 'rose',
      requiresSelection: true,
    },
    {
      id: 'markPaid',
      label: 'Mark paid',
      tone: 'emerald',
      requiresSelection: true,
    },
    {
      id: 'retry',
      label: 'Retry selected',
      tone: 'amber',
      requiresSelection: true,
    },
    {
      id: 'unschedule',
      label: 'Unschedule selected',
      tone: 'slate',
      requiresSelection: true,
    },
  ],
} as const satisfies PlaceholderTableState;
