// Composite (joined) bill views returned by the read repository. This
// file is allowed to import from every other domain because the bill is
// the central entity that everything else hangs off of. Nothing imports
// from here in the opposite direction, so no cycles are introduced.

import type { Category } from '../category';
import type { Payment } from '../payment';
import type { User } from '../user';
import type { Vendor } from '../vendor';

import type { Bill, BillLineItem } from './bill';

export interface BillWithRelations extends Bill {
  vendor: Vendor;
  creator: User;
  lineItems: BillLineItem[];
  payments: Payment[];
}

export interface BillListItem extends Bill {
  vendor: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>;
  creator: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
  lineItems: (BillLineItem & { category: Category | null })[];
  lineItemCount: number;
}

export interface BillFormOptions {
  vendors: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>[];
  categories: Pick<Category, 'id' | 'name'>[];
}
