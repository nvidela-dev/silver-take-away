// Bill workspace filter shape used by the list/search query.

import type { BillStatus, PaymentMethodType } from '../enums';

export interface BillFilters {
  search?: string;
  vendorId?: string;
  vendorOwnerId?: string;
  status?: BillStatus[];
  isUnscheduled?: boolean;
  amountMin?: number;
  amountMax?: number;
  paymentMethod?: PaymentMethodType;
  categoryId?: string;
  excludeCategoryId?: string;
  invoiceDateFrom?: string;
  invoiceDateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}
