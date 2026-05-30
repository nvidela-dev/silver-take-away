import type { Category } from '../category';
import type { BillStatus } from '../enums';
import type { User } from '../user';
import type { Vendor } from '../vendor';

export interface BillFilterOptions {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  owners: Pick<User, 'id' | 'email' | 'fullName'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}

export interface BillFilters {
  search?: string;
  status?: BillStatus[];
  vendorId?: string;
  vendorOwnerId?: string;
  categoryId?: string;
  amountMin?: number;
  amountMax?: number;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface BillPagination {
  page: number;
  pageSize: number;
}

export interface BillListQuery {
  statuses: BillStatus[];
  filters?: BillFilters;
  pagination?: BillPagination;
}

export interface BillListResult<T> {
  items: T[];
  total: number;
}
