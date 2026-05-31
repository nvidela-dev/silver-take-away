import type { Category } from '../category';
import type { BillStatus } from '../enums';
import type { User } from '../user';
import type { Vendor } from '../vendor';

export type { BillFilters } from '@/lib/validators/bill-filter-spec';

export interface BillReferenceData {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  owners: Pick<User, 'id' | 'email' | 'fullName'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export interface BillPagination {
  page: number;
  pageSize: number;
}

export interface BillListQuery {
  statuses: readonly BillStatus[];
  filters?: import('@/lib/validators/bill-filter-spec').BillFilters;
  pagination?: BillPagination;
}

export interface BillListResult<T> {
  items: T[];
  total: number;
}

export interface BillStatusAggregate {
  status: BillStatus;
  count: number;
  totalAmount: string;
}
