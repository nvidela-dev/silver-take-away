// Composite (joined) payment views returned by the read repository.
// Payments depend on Bills/Vendors/Users; the dependency only flows
// one way (payment/views imports from bill, vendor, user — never the
// reverse), so importing from those domains does not introduce a cycle.

import type { Bill } from '../bill/bill';
import type { User } from '../user';
import type { Vendor } from '../vendor';

import type { Payment } from './payment';

export interface PaymentWithRelations extends Payment {
  bill: Bill;
  vendor: Vendor;
  creator: User;
}

export interface PaymentListItem extends Payment {
  bill: Pick<Bill, 'id' | 'invoiceNumber' | 'invoiceDate' | 'dueDate' | 'description'>;
  vendor: Pick<Vendor, 'id' | 'name' | 'email' | 'ownerId'>;
  creator: Pick<User, 'id' | 'email' | 'fullName' | 'role'>;
}
