import type {
  NavigationItem,
  PlaceholderTableState,
  SurfaceTab,
} from '@/types';

export const dashboardNavigation = [
  {
    href: '/bills',
    label: 'Bills',
    description: 'Invoice intake, approval, payment readiness, and history.',
    icon: 'receipt',
  },
  {
    href: '/payments',
    label: 'Payments',
    description: 'Scheduled, initiated, failed, and completed payment records.',
    icon: 'credit-card',
  },
  {
    href: '/vendors',
    label: 'Vendors',
    description: 'Vendor profiles and payment method setup.',
    icon: 'building',
  },
] as const satisfies readonly NavigationItem[];

export const billTabs = [
  {
    value: 'overview',
    label: 'Overview',
    href: '/bills',
    description: 'Bill counts and operational summary.',
  },
  {
    value: 'drafts',
    label: 'Drafts',
    href: '/bills?tab=drafts',
    description: 'Bills being prepared before approval.',
  },
  {
    value: 'approvals',
    label: 'For Approval',
    href: '/bills?tab=approvals',
    description: 'Bills awaiting approval decisions.',
  },
  {
    value: 'payment',
    label: 'For Payment',
    href: '/bills?tab=payment',
    description: 'Approved bills ready to schedule or pay.',
  },
  {
    value: 'history',
    label: 'History',
    href: '/bills?tab=history',
    description: 'Paid, rejected, and archived bills.',
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
    label: 'Needs Review',
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

export const billPlaceholderTable = {
  title: 'Bills table shell',
  description: [
    'Columns and actions are standardized here;',
    'real bill rows land in PR-5.',
  ].join(' '),
  emptyMessage: 'Bill data wiring starts in PR-5.',
  columns: [
    {
      id: 'select',
      label: '',
      isConfigurable: false,
    },
    {
      id: 'vendor',
      label: 'Vendor / Owner',
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
      id: 'dueDate',
      label: 'Due Date',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'invoiceNumber',
      label: 'Invoice #',
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
      id: 'archive',
      label: 'Archive',
      tone: 'amber',
    },
  ],
  bulkActions: [
    {
      id: 'approve',
      label: 'Approve selected',
      tone: 'emerald',
      requiresSelection: true,
    },
    {
      id: 'archive',
      label: 'Archive selected',
      tone: 'amber',
      requiresSelection: true,
    },
  ],
} as const satisfies PlaceholderTableState;

export const paymentPlaceholderTable = {
  title: 'Payments table shell',
  description: [
    'Payment columns and row actions are fixed',
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
  ],
} as const satisfies PlaceholderTableState;

export const vendorPlaceholderTable = {
  title: 'Vendors table shell',
  description: 'Vendor columns are reserved now; CRUD behavior lands later.',
  emptyMessage: 'Vendor data wiring starts in the vendor feature PR.',
  columns: [
    {
      id: 'name',
      label: 'Vendor',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'owner',
      label: 'Owner',
      isSortable: true,
      isConfigurable: true,
    },
    {
      id: 'email',
      label: 'Email',
      isConfigurable: true,
    },
    {
      id: 'paymentMethods',
      label: 'Payment Methods',
      isConfigurable: true,
    },
  ],
  actions: [
    {
      id: 'view',
      label: 'View detail',
    },
    {
      id: 'edit',
      label: 'Edit',
    },
  ],
} as const satisfies PlaceholderTableState;
