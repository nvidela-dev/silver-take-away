import type { Category } from '../category';
import type { PaymentStatus } from '../enums';
import type { User } from '../user';
import type { Vendor } from '../vendor';

import type { PaymentFilterTab } from './tabs';
import type { PaymentListItem } from './views';

export type { PaymentFilters } from '@/lib/validators/payment-filter-spec';
export type { PaymentSort } from '@/lib/validators/payment-sort-spec';

export interface PaymentReferenceData {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  owners: Pick<User, 'id' | 'email' | 'fullName'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export interface PaymentPagination {
  page: number;
  pageSize: number;
}

export interface PaymentListQuery {
  statuses: readonly PaymentStatus[];
  filters?: import('@/lib/validators/payment-filter-spec').PaymentFilters;
  pagination?: PaymentPagination;
  sort?: import('@/lib/validators/payment-sort-spec').PaymentSort;
}

export interface PaymentListResult<T> {
  amountTotal: string;
  items: T[];
  total: number;
}

export interface PaymentStatusAggregate {
  status: PaymentStatus;
  count: number;
  totalAmount: string;
}

export interface PaymentOverviewGroup {
  tab: PaymentFilterTab;
  result: PaymentListResult<PaymentListItem>;
}
